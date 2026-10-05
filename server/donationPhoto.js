export function isValidDonationPhoto(photo) {
  if (typeof photo !== 'string' || photo.length > 680000) return false;
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if (!match) return false;
  const bytes = Buffer.from(match[1], 'base64');
  return bytes.length > 4 && bytes.toString('base64') === match[1]
    && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
}
