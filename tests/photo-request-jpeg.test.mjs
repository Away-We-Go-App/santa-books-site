import test from 'node:test';
import assert from 'node:assert/strict';
import { captureDateTimeOriginal, withCaptureDateTimeOriginal } from '../public/photos/jpeg.mjs';

const join = (...parts) => {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
};

const app1 = payload => join(new Uint8Array([0xff, 0xe1, 0, payload.length + 2]), payload);

function sourceExif() {
  const prefix = new TextEncoder().encode('Exif\0\0');
  const payload = new Uint8Array(180);
  payload.set(prefix);
  const tiff = prefix.length;
  payload.set([0x4d, 0x4d, 0, 42, 0, 0, 0, 8], tiff);
  // IFD0: ImageDescription (private filename), Exif pointer, GPS pointer.
  payload.set([0, 3], tiff + 8);
  payload.set([0x01, 0x0e, 0, 2, 0, 0, 0, 19, 0, 0, 0, 80], tiff + 10);
  payload.set([0x87, 0x69, 0, 4, 0, 0, 0, 1, 0, 0, 0, 52], tiff + 22);
  payload.set([0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 76], tiff + 34);
  // Exif IFD: DateTimeOriginal only.
  payload.set([0, 1, 0x90, 0x03, 0, 2, 0, 0, 0, 20, 0, 0, 0, 100, 0, 0, 0, 0], tiff + 52);
  payload.set(new TextEncoder().encode('IMG_private-name.jpg\0'), tiff + 80);
  payload.set(new TextEncoder().encode('2024:12:25 07:08:09\0'), tiff + 100);
  payload.set(new TextEncoder().encode('GPS=47.6062,-122.3321\0'), tiff + 130);
  return payload;
}

test('extracts only a valid DateTimeOriginal from a JPEG EXIF segment', () => {
  const source = join(new Uint8Array([0xff, 0xd8]), app1(sourceExif()), new Uint8Array([0xff, 0xd9]));
  assert.equal(captureDateTimeOriginal(source), '2024:12:25 07:08:09');
  const malformed = source.slice();
  malformed[2 + 4 + 6 + 100 + 5] = 0x39; // month 19
  assert.equal(captureDateTimeOriginal(malformed), undefined);
});

test('writes a fresh date-only EXIF block without source location or private metadata', () => {
  const normalizedPixels = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const output = withCaptureDateTimeOriginal(normalizedPixels, '2024:12:25 07:08:09');
  assert.equal(captureDateTimeOriginal(output), '2024:12:25 07:08:09');
  const text = new TextDecoder().decode(output);
  assert.equal(text.includes('GPS='), false);
  assert.equal(text.includes('private-name'), false);
  assert.equal(text.includes('47.6062'), false);
  assert.deepEqual([...output.slice(-2)], [0xff, 0xd9]);
});

test('does not tag malformed dates or non-JPEG output', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  assert.strictEqual(withCaptureDateTimeOriginal(png, '2024:12:25 07:08:09'), png);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  assert.strictEqual(withCaptureDateTimeOriginal(jpeg, '2024:13:25 07:08:09'), jpeg);
});
