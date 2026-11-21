import { writeFileSync } from 'node:fs';

// Only public Santa project references belong here. Never accept an upload host from an invite.
const projects = {};
for (const environment of ['production', 'staging']) {
  const ref = process.env[`SANTA_PHOTO_PROJECT_${environment.toUpperCase()}`];
  if (!ref) continue;
  if (!/^[a-z0-9]{20}$/.test(ref)) throw new Error(`Invalid Santa project reference for ${environment}`);
  projects[environment] = `https://${ref}.supabase.co/functions/v1/santa-photo-requests`;
}
writeFileSync(new URL('../public/photos/relay.json', import.meta.url), JSON.stringify(projects));
