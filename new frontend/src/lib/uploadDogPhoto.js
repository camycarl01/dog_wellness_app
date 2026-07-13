import { supabase } from './supabase'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

// Resize/compress in-browser before upload. Returns a Blob.
function resizeImage(file, maxSize = 224) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      // cover-crop to a square, then scale to maxSize
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      canvas.width = maxSize
      canvas.height = maxSize
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Image processing failed'))),
        'image/jpeg',
        0.9
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

// Uploads a dog photo and returns its public URL.
// Bucket must exist in Supabase Storage (see note below).
export async function uploadDogPhoto(file, userId) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be under 5MB.')
  }

  const blob = await resizeImage(file)
  const path = `${userId}/${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('dog-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('dog-photos').getPublicUrl(path)
  return data.publicUrl
}