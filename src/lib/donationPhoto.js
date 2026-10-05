export async function prepareDonationPhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Seleccioná una foto JPG, PNG o WebP.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La foto debe pesar como máximo 10 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5, 0.3]) {
      const photo = canvas.toDataURL('image/jpeg', quality);
      if (photo.length < 680000) return photo;
    }
    throw new Error('La foto es demasiado grande. Elegí una imagen de menor tamaño.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
