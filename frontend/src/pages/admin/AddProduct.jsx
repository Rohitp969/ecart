import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ImageUpload from '@/components/ImageUpload'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { setProducts } from '@/redux/productSlice'
import { Loader2 } from 'lucide-react'
import store from '@/redux/store'

const AddProduct = () => {
  const accessToken = localStorage.getItem("accessToken")
  const dispatch = useDispatch()
  const {products} = useSelector(store=>store.product)
  const [loading, setLoading] = useState(false)
  const [productData, setProductData] = useState({
    productName: "",
    productPrice: 0,
    productDesc: "",
    productImg: [],
    brand: "",
    category: ""
  })

  const handleChange = (e)=>{
     const {name, value} = e.target;
     setProductData((prev)=>({
      ...prev,
      [name]:value
     }))
  }

  const submitHandler = async (e)=>{
    e.preventDefault()
    const formData = new FormData();
    formData.append("productName", productData.productName);
    formData.append("productPrice", productData.productPrice);
    formData.append("productDesc", productData.productDesc);
    formData.append("category", productData.category);
    formData.append("brand", productData.brand);

    if(productData.productImg.length === 0){
      toast.error("Please select at least one image");
      return;
    }
    productData.productImg.forEach((img)=>{
      formData.append("file", img)
    })
    try {
      setLoading(true)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/product/add`, formData,{
        headers:{
          Authorization:`Bearer ${accessToken}`
        }
      })
      if(res.data.success){
        dispatch(setProducts([...products, res.data.product]))
        toast.success(res.data.message)
      }
    } catch (error) {
      console.log(error);
      
    } finally{
      setLoading(false)
    }
  }

  return (
    <div className='pl-[350px] py-10 pr-20 mx-auto px-4 bg-gray-100'>
     <Card className='w-full my-20'>
       <CardHeader>
        <CardTitle>Add Product</CardTitle>
        <CardDescription>Enter Product details below</CardDescription>
       </CardHeader>
       <CardContent>
        <div className='flex flex-col gap-2'>
          <div className='grid gap-2'>
            <Label>Product Name</Label>
            <Input type='text' 
            name="productName" 
            value={productData.productName}
            onChange={handleChange}
            placeholder="Ex-Iphone" 
            required/>
          </div>
            <div className='grid gap-2'>
            <Label>Price</Label>
            <Input type='number' 
            name="productPrice" 
             value={productData.productPrice}
            onChange={handleChange}
            placeholder="" 
            required/>
          </div>
          <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
            <Label>Brand</Label>
            <Input type='text' 
            name="brand" 
            value={productData.brand}
            onChange={handleChange}
            placeholder="Ex-apple" 
            required/>
          </div>
            <div className='grid gap-2'>
            <Label>Category</Label>
            <Input type='text' 
            name="category" 
            value={productData.category}
            onChange={handleChange}
            placeholder="Ex-mobile" 
            required/>
          </div>
          </div>
          <div className='grid gap-2'>
            <div className='flex items-center'>
              <Label>Description</Label>
            </div>
            <Textarea name="productDesc"
            value={productData.productDesc}
            onChange={handleChange}
             placeholder="Enter brief description of product"/>
          </div>
           <ImageUpload 
            productData={productData}
            setProductData={setProductData}
            />
        </div>
        <CardFooter className="flex-col gap-2">
          <Button 
          disabled={loading} 
          onClick={submitHandler } 
          className="w-full mt-5 bg-pink-600 cursor-pointer" 
          type="submit">
            {
              loading ? <span className='flex gap-1 items-center'><Loader2 className='animate-spin'/>Please wait</span>
              : 'Add Product'
            }
          </Button>
        </CardFooter>
       </CardContent>
     </Card>

      
    </div>
  )
}

export default AddProduct
