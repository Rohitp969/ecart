import React, { useState } from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { ImageOff } from 'lucide-react'

// Main image box height per breakpoint; the image's max height matches it so tall photos are never cropped
const BOX_HEIGHT = 'h-80 sm:h-96 lg:h-120'
const IMG_MAX_HEIGHT = 'max-h-80 sm:max-h-96 lg:max-h-120'

// Parent passes key={product._id} so the selected image resets when the product changes
const ProductImg = ({ images = [], name = '' }) => {
  const [mainImg, setMainImg] = useState(images[0]?.url)

  if (!mainImg) {
    return (
      <div className={`flex w-full items-center justify-center rounded-xl bg-gray-50 text-gray-300 ${BOX_HEIGHT}`}>
        <ImageOff className='h-16 w-16' />
      </div>
    )
  }

  return (
    <div className='flex min-w-0 flex-col-reverse gap-4 sm:flex-row lg:sticky lg:top-28'>
      {images.length > 1 && (
        <div className='flex shrink-0 gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:max-h-96 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0 lg:max-h-120'>
          {images.map((img) => (
            <button
              key={img.public_id || img.url}
              onClick={() => setMainImg(img.url)}
              onMouseEnter={() => setMainImg(img.url)}
              className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-gray-50 p-1 transition sm:h-20 sm:w-20 ${
                mainImg === img.url ? 'border-pink-600' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <img src={img.url} alt='' className='h-full w-full object-contain mix-blend-multiply' />
            </button>
          ))}
        </div>
      )}
      <div className={`flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gray-50 ${BOX_HEIGHT}`}>
        <Zoom>
          <img src={mainImg} alt={name} className={`w-full object-contain p-4 mix-blend-multiply sm:p-6 ${IMG_MAX_HEIGHT}`} />
        </Zoom>
      </div>
    </div>
  )
}

export default ProductImg
