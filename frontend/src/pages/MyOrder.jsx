import axios from 'axios'
import React, { useEffect, useState } from 'react'
import OrderCart from '../components/OrderCart'

const MyOrder = () => {
   const [userOrder, setUserOrder] = useState([])

   const getUserOrders = async () => {
    try {
    const accessToken = localStorage.getItem("accessToken")

    const res = await axios.get(`${import.meta.env.VITE_URL}/api/v1/orders/myorder`, {
        headers:{
            Authorization:`Bearer ${accessToken}`
        }
    })
    if(res.data.success) {
        setUserOrder(res.data.orders)
    }
   }   catch (error) {
    console.log(error)
  }
}

   useEffect(()=>{
    getUserOrders()
   }, [])


  return (
    <>
    <OrderCart userOrder={userOrder}/>
    </>
  )
}

export default MyOrder
