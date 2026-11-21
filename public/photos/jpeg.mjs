// Re-encoding strips embedded location, filenames and other EXIF fields before upload.
// The one exception is a strictly validated DateTimeOriginal. It becomes a fresh,
// date-only EXIF block on the normalized JPEG so the organizer can retain the
// original capture date without inheriting any other source metadata.
const MAX_EXIF_SCAN_BYTES = 256 * 1024;
const MAX_EXIF_SEGMENTS = 64;
const EXIF_PREFIX = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0]);

const read16 = (bytes, offset, littleEndian) => {
  if (offset < 0 || offset + 2 > bytes.length) return undefined;
  return littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1];
};

const read32 = (bytes, offset, littleEndian) => {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  return littleEndian
    ? (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] * 0x1000000)) >>> 0
    : ((bytes[offset] * 0x1000000) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
};

function validDateTimeOriginal(value) {
  if (!/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return false;
  const [year, month, day, hour, minute, second] = value.match(/\d+/g).map(Number);
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  return day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dateTimeOriginalInExif(payload) {
  if (payload.length < EXIF_PREFIX.length + 8 || !EXIF_PREFIX.every((value, index) => payload[index] === value)) return undefined;
  const tiff = EXIF_PREFIX.length;
  const littleEndian = payload[tiff] === 0x49 && payload[tiff + 1] === 0x49;
  if (!littleEndian && !(payload[tiff] === 0x4d && payload[tiff + 1] === 0x4d)) return undefined;
  if (read16(payload, tiff + 2, littleEndian) !== 42) return undefined;
  const firstIFDOffset = read32(payload, tiff + 4, littleEndian);
  if (firstIFDOffset === undefined) return undefined;

  const entry = (ifdOffset, wantedTag) => {
    const count = read16(payload, tiff + ifdOffset, littleEndian);
    if (count === undefined || count > 64) return undefined;
    const start = tiff + ifdOffset + 2;
    if (start + count * 12 + 4 > payload.length) return undefined;
    for (let index = 0; index < count; index++) {
      const offset = start + index * 12;
      if (read16(payload, offset, littleEndian) === wantedTag) {
        return {
          type: read16(payload, offset + 2, littleEndian),
          count: read32(payload, offset + 4, littleEndian),
          valueOffset: offset + 8,
          value: read32(payload, offset + 8, littleEndian)
        };
      }
    }
    return undefined;
  };

  const exifPointer = entry(firstIFDOffset, 0x8769);
  if (!exifPointer || exifPointer.type !== 4 || exifPointer.count !== 1 || exifPointer.value === undefined) return undefined;
  const date = entry(exifPointer.value, 0x9003);
  if (!date || date.type !== 2 || date.count !== 20 || date.value === undefined) return undefined;
  const valueOffset = tiff + date.value;
  if (valueOffset < tiff || valueOffset + 20 > payload.length || payload[valueOffset + 19] !== 0) return undefined;
  const value = String.fromCharCode(...payload.slice(valueOffset, valueOffset + 19));
  return validDateTimeOriginal(value) ? value : undefined;
}

// Reads only DateTimeOriginal from a known bounded JPEG EXIF APP1 segment.
// Unsupported, malformed, or oversized metadata simply yields no date.
export function captureDateTimeOriginal(jpeg) {
  const bytes = jpeg instanceof Uint8Array ? jpeg : new Uint8Array(jpeg);
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  const limit = Math.min(bytes.length, MAX_EXIF_SCAN_BYTES);
  let offset = 2;
  for (let segments = 0; segments < MAX_EXIF_SEGMENTS && offset + 4 <= limit; segments++) {
    if (bytes[offset++] !== 0xff) return undefined;
    while (offset < limit && bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = read16(bytes, offset, false);
    if (length === undefined || length < 2 || offset + length > limit) return undefined;
    const payloadStart = offset + 2;
    const payloadEnd = offset + length;
    if (marker === 0xe1) {
      const date = dateTimeOriginalInExif(bytes.slice(payloadStart, payloadEnd));
      if (date) return date;
    }
    offset = payloadEnd;
  }
  return undefined;
}

function dateOnlyExif(date) {
  const text = new TextEncoder().encode(`${date}\0`);
  const payload = new Uint8Array(70);
  payload.set(EXIF_PREFIX);
  const tiff = EXIF_PREFIX.length;
  payload.set([0x4d, 0x4d, 0, 42, 0, 0, 0, 8], tiff);
  let offset = tiff + 8;
  payload.set([0, 1, 0x87, 0x69, 0, 4, 0, 0, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0], offset);
  offset += 18;
  payload.set([0, 1, 0x90, 0x03, 0, 2, 0, 0, 0, 20, 0, 0, 0, 44, 0, 0, 0, 0], offset);
  payload.set(text, tiff + 44);
  return payload;
}

// Adds the fresh, date-only EXIF block after SOI. The caller supplies canvas
// output, so no source JPEG metadata is copied through.
export function withCaptureDateTimeOriginal(jpeg, date) {
  if (!validDateTimeOriginal(date)) return jpeg;
  const bytes = jpeg instanceof Uint8Array ? jpeg : new Uint8Array(jpeg);
  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return jpeg;
  const exif = dateOnlyExif(date);
  const app1 = new Uint8Array(exif.length + 4);
  app1.set([0xff, 0xe1, 0, exif.length + 2]);
  app1.set(exif, 4);
  const output = new Uint8Array(bytes.length + app1.length);
  output.set(bytes.slice(0, 2));
  output.set(app1, 2);
  output.set(bytes.slice(2), 2 + app1.length);
  return output;
}

export async function printableJPEG(file) {
  if (file.size > 80 * 1024 * 1024) throw new Error('This file is too large. Choose a smaller copy.');
  const captureDate = file.type === 'image/jpeg'
    ? captureDateTimeOriginal(await file.slice(0, MAX_EXIF_SCAN_BYTES).arrayBuffer())
    : undefined;
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    image.src = url;
    try { await image.decode(); } catch { throw new Error('Choose a JPEG or PNG copy of this photo.'); }
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longest) throw new Error('This photo could not be opened.');
    const scale = Math.min(1, 5200 / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This photo could not be prepared.');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    try {
      for (const quality of [0.95, 0.86]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= 15 * 1024 * 1024) {
          if (!captureDate) return blob;
          const tagged = withCaptureDateTimeOriginal(await blob.arrayBuffer(), captureDate);
          if (tagged.byteLength <= 15 * 1024 * 1024) {
            return new Blob([tagged], { type: 'image/jpeg' });
          }
        }
      }
      throw new Error('This photo is too large. Choose a smaller copy.');
    } finally {
      canvas.width = canvas.height = 0;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
