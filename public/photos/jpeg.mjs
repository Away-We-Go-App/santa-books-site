// Re-encoding strips embedded location, filenames and other EXIF fields before upload.
export async function printableJPEG(file) {
  if (file.size > 80 * 1024 * 1024) throw new Error('This file is too large. Choose a smaller copy.');
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
        if (blob && blob.size <= 15 * 1024 * 1024) return blob;
      }
      throw new Error('This photo is too large. Choose a smaller copy.');
    } finally {
      canvas.width = canvas.height = 0;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
