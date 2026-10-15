/** Normalise inline images without loading an image codec or changing image bytes. */
export function parseInlineImage(image: string, declaredMime?: string): { data: string, mimeType: string } {
  const match = /^data:([^;,]+);base64,(.*)$/is.exec(image)
  const data = (match?.[2] || image.replace(/^base64:\/\//i, '')).replace(/\s/g, '')
  const bytes = Buffer.from(data.slice(0, 32), 'base64')
  let mimeType = (match?.[1] || declaredMime || 'image/jpeg').split(';')[0].trim().toLowerCase()
  if (bytes[0] === 0xff && bytes[1] === 0xd8) mimeType = 'image/jpeg'
  else if (bytes.toString('ascii', 1, 4) === 'PNG') mimeType = 'image/png'
  else if (bytes.toString('ascii', 0, 3) === 'GIF') mimeType = 'image/gif'
  else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') mimeType = 'image/webp'
  if (mimeType === 'image/jpg') mimeType = 'image/jpeg'
  return { data, mimeType }
}
