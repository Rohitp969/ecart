import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

const MAX_NEW_FILES = 5   // backend accepts up to 5 files per request
const MAX_SIZE_MB = 5

// images: [{ key, url, public_id }] for saved images, [{ key, url, file }] for new uploads
const ImageUpload = ({ images, setImages }) => {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const latest = useRef(images)

  useEffect(() => {
    latest.current = images
  }, [images])

  // free preview blobs when the form goes away
  useEffect(() => () => latest.current.forEach((img) => img.file && URL.revokeObjectURL(img.url)), [])

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    const fitting = files.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024)
    if (fitting.length < files.length) toast.error(`Images must be under ${MAX_SIZE_MB} MB`)
    const room = MAX_NEW_FILES - images.filter((img) => img.file).length
    if (fitting.length > room) toast.error(`You can add up to ${MAX_NEW_FILES} new images per save`)
    const added = fitting.slice(0, Math.max(0, room)).map((file) => ({
      key: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      file,
    }))
    if (added.length) setImages([...images, ...added])
  }

  const removeImage = (key) => {
    const image = images.find((img) => img.key === key)
    if (image?.file) URL.revokeObjectURL(image.url)
    setImages(images.filter((img) => img.key !== key))
  }

  return (
    <div>
      <div
        role='button'
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
        }`}
      >
        <ImagePlus className='h-8 w-8 text-gray-400' />
        <p className='mt-2 text-sm font-semibold text-gray-700'>Click to upload or drag & drop</p>
        <p className='text-xs text-gray-500'>PNG, JPG or WEBP · up to {MAX_SIZE_MB} MB each</p>
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {images.length > 0 && (
        <div className='mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5'>
          {images.map((img, index) => (
            <div key={img.key} className='group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50'>
              <img src={img.url} alt='' className='h-full w-full object-contain p-2 mix-blend-multiply' />
              {index === 0 && (
                <span className='absolute left-1.5 top-1.5 rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                  Cover
                </span>
              )}
              {img.file && (
                <span className='absolute bottom-1.5 left-1.5 rounded bg-pink-600 px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                  New
                </span>
              )}
              {/* only hidden-until-hover for mouse users; touch tablets/phones always see it */}
              <button
                type='button'
                onClick={() => removeImage(img.key)}
                aria-label='Remove image'
                className='absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 p-1.5 text-white opacity-100 transition hover:bg-red-600 focus-visible:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
