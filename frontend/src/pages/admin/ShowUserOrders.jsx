import axios from "axios";
import OrderCart from "@/components/OrderCart";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ShowUserOrders = () => {
  const params = useParams();

  const [userOrder, setUserOrder] = useState([]);

  const getUserOrders = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const res = await axios.get(`${import.meta.env.VITE_URL}/api/v1/orders/user-order/${params.userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if(res.data.success){
        setUserOrder(res.data.orders)
  }
}

 useEffect(()=>{
    getUserOrders()
   }, [])

  return (
     <div className="pl-[350px] py-20">
     <OrderCart userOrder={userOrder}/>
     </div>
  )
}

export default ShowUserOrders

