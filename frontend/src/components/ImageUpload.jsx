import { Label } from './ui/label'
import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

const ImageUpload = (productData, setProductData) => {
  return (
    <div className='grid gap-2'>
      <Label>Product Images</Label>
      <Input type='file' id="file-upload" className="hidden" accept="image*" multiple/>
      <Button variant='outline'>
        <label htmlFor='file-upload' className='cursor-pointer'>Upload Images</label>
      </Button>

      {/* image preview */}
      {
        productData.productImg.length > 0 && (
          <div className='grid grid-cols-2 gap-4 mt-3 sm:grid-cols-3'>
            
          </div>
        )
      }
    </div>
  )
}

export default ImageUpload