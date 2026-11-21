import { printableJPEG } from './jpeg.mjs';
import { retryRateLimited } from './retry.mjs';

const el = id => document.getElementById(id);
const entries = [];
let relay, token, owner, sending = false, closed = false, selectionExpanded = false;
const collapsedSelectionCount = 6;
const nameSegments = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const nameLength = value => nameSegments ? Array.from(nameSegments.segment(value)).length : Array.from(value).length;

async function call(options, upload = false) {
  const url = new URL(relay);
  if (upload) url.searchParams.set('action', 'upload');
  const response = await fetch(url, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', ...options });
  if (!response.ok) {
    const messages = { 410: 'This request is closed.', 413: 'This photo exceeds the upload limit.', 429: 'The upload limit has been reached. Try again later.', 415: 'This photo format could not be accepted.' };
    const error = new Error(messages[response.status] || 'Could not send. Try again.');
    error.status = response.status;
    if (response.status === 429) error.retryAfter = response.headers.get('Retry-After');
    throw error;
  }
  return response.json();
}

function render() {
  const pending = entries.filter(entry => !entry.expires);
  const delivered = entries.filter(entry => entry.expires).length;
  if (entries.length <= collapsedSelectionCount) selectionExpanded = false;
  const visibleEntries = selectionExpanded ? entries : entries.slice(0, collapsedSelectionCount);
  el('selection').replaceChildren(...visibleEntries.map((entry, index) => {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.src = entry.preview;
    image.alt = `Selected photo ${index + 1}`;
    item.append(image);
    if (entry.expires || entry.error) {
      const label = document.createElement('small');
      label.textContent = entry.expires ? 'Uploaded' : entry.error;
      item.append(label);
    }
    if (!sending && !entry.expires && !closed) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
      remove.onclick = () => { URL.revokeObjectURL(entry.preview); entries.splice(index, 1); render(); };
      item.append(remove);
    }
    return item;
  }));
  el('selection-summary').hidden = !entries.length;
  el('selection-count').textContent = `${entries.length} photo${entries.length === 1 ? '' : 's'} selected${delivered ? ` · ${delivered} uploaded` : ''}`;
  el('selection-toggle').hidden = entries.length <= collapsedSelectionCount;
  el('selection-toggle').textContent = selectionExpanded ? 'Show fewer' : 'Show all';
  el('selection-toggle').setAttribute('aria-expanded', String(selectionExpanded));
  el('selection-toggle').setAttribute('aria-label', selectionExpanded ? `Show only the first ${collapsedSelectionCount} of ${entries.length} selected photos` : `Show all ${entries.length} selected photos`);
  el('choose').textContent = entries.length ? 'Choose more photos' : 'Choose photos';
  el('choose').classList.toggle('secondary', entries.length > 0);
  el('choose').disabled = sending || closed;
  el('name').disabled = sending || entries.some(entry => entry.attempted);
  el('review').hidden = !entries.length;
  el('send').disabled = sending || closed || !pending.length;
  el('send').textContent = sending ? 'Sending…' : `${entries.some(entry => entry.attempted) ? 'Retry' : 'Send'} ${pending.length} photo${pending.length === 1 ? '' : 's'}`;
}

function receipt() {
  const delivered = entries.filter(entry => entry.expires);
  const remaining = entries.length - delivered.length;
  const messages = [];
  if (delivered.length) {
    const firstExpiry = new Date(Math.min(...delivered.map(entry => entry.expires)));
    const deadline = firstExpiry.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    messages.push(`Sent ${delivered.length} photo${delivered.length === 1 ? '' : 's'} to ${owner}. ${delivered.length === 1 ? 'It' : 'They'} can be downloaded until ${deadline}.`);
  } else {
    messages.push('We couldn’t confirm that any photos were sent.');
  }
  if (closed) {
    if (remaining) messages.push(`The request closed before we could confirm the other ${remaining}. Ask the organizer which photos arrived.`);
    return messages.join('\n');
  }
  if (remaining) messages.push(`${remaining} photo${remaining === 1 ? ' still needs' : 's still need'} to be sent.`);
  return messages.join('\n');
}

el('choose').onclick = () => el('files').click();
el('selection-toggle').onclick = () => { selectionExpanded = !selectionExpanded; render(); el('selection-toggle').focus(); };
el('files').onchange = () => {
  for (const file of el('files').files) {
    if (entries.length >= 100) { el('status').textContent = 'Choose up to 100 photos per batch.'; break; }
    entries.push({ file, id: crypto.randomUUID(), preview: URL.createObjectURL(file) });
  }
  el('files').value = '';
  render();
};
el('name').oninput = () => { el('name-error').textContent = ''; };

el('request').onsubmit = async event => {
  event.preventDefault();
  if (sending || closed) return;
  const name = el('name').value.trim();
  if (!name || nameLength(name) > 60 || new TextEncoder().encode(name).length > 4096 || /[\u0000-\u001f\u007f]/.test(name)) {
    el('name-error').textContent = 'Use a name or nickname up to 60 characters.';
    el('name').focus();
    return;
  }
  sending = true;
  render();
  try {
    for (const entry of entries) {
      if (entry.expires) continue;
      el('status').textContent = `Sending photo ${entries.indexOf(entry) + 1} of ${entries.length}. Keep this page open.`;
      try {
        // Retain the exact bytes for a lost-response retry on this page.
        entry.jpeg ??= await printableJPEG(entry.file);
        entry.attempted = true;
        const ack = await retryRateLimited(
          () => call({ headers: { 'Content-Type': 'image/jpeg', 'X-Request-Token': token,
            'X-Photo-ID': entry.id, 'X-Sender-Name': encodeURIComponent(name) }, body: entry.jpeg }, true),
          { onWait: delay => {
            const seconds = Math.max(1, Math.ceil(delay / 1_000));
            const sent = entries.filter(photo => photo.expires).length;
            el('status').textContent = `${sent} of ${entries.length} sent. Sending will resume in ${seconds} second${seconds === 1 ? '' : 's'}. Keep this page open.`;
          } }
        );
        const expires = Date.parse(ack.expiresAt);
        if (!Number.isFinite(expires)) throw new Error('Could not confirm this upload. Try again.');
        entry.expires = expires;
        entry.jpeg = null;
        entry.error = '';
      } catch (error) {
        entry.error = error instanceof TypeError ? 'Connection interrupted. Try again.' : error.message;
        if (error.status === 410) { closed = true; break; }
        if (error.status === 429) break;
      }
    }
  } finally {
    sending = false;
    render();
  }
  const complete = entries.length > 0 && entries.every(entry => entry.expires);
  el('status').textContent = receipt();
  if (complete || closed) {
    el('request').hidden = true;
    el('again').hidden = closed;
    for (const entry of entries) URL.revokeObjectURL(entry.preview);
    entries.length = 0;
    selectionExpanded = false;
    render();
  }
};

el('again').onclick = () => {
  el('status').textContent = '';
  el('again').hidden = true;
  el('request').hidden = false;
  render();
  el('choose').focus();
};

async function openInvite() {
  el('reload').hidden = true;
  const match = /^#(staging|production)\/([a-zA-Z0-9_-]{43})$/.exec(location.hash);
  if (!match) { el('intro').textContent = 'Open the full invitation from the person asking for photos.'; return; }
  try {
    const config = await fetch('./relay.json', { cache: 'no-store', credentials: 'omit' }).then(response => response.json());
    relay = config[match[1]];
    if (!relay || !/^https:\/\/[a-z0-9]{20}\.supabase\.co\/functions\/v1\/santa-photo-requests$/.test(relay)) throw new Error();
    token = match[2];
    const info = await call({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'info', token }) });
    owner = info.ownerName && info.ownerName !== 'A Santa Books family' ? String(info.ownerName) : 'the organizer';
    el('occasion').textContent = `Christmas ${info.year}`;
    el('intro').textContent = owner === 'the organizer' ? 'You’ve been invited to share photos for a Christmas book.' : `${owner} is collecting photos for a Christmas book.`;
    el('consent').textContent = `${owner === 'the organizer' ? 'The organizer' : owner} will receive a copy of each photo to keep and use in their Christmas book.`;
    el('request').hidden = false;
    render();
  } catch (error) {
    if (error.status === 410) {
      el('occasion').textContent = 'This request is closed';
      el('intro').textContent = 'Ask the person who invited you for a new link.';
    } else {
      el('intro').textContent = 'The invitation couldn’t be opened. Check your connection and try again.';
      el('reload').hidden = false;
    }
  }
}
el('reload').onclick = openInvite;
openInvite();
