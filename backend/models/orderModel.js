import mongoose from "mongoose";

export const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];
export const PAYMENT_METHODS = ["Online", "COD"];

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    products: [
        {
        productId:{type: mongoose.Schema.Types.ObjectId, ref:"Product", required:true},
        quantity:{type:Number, required:true},
        price:{type:Number}   // unit price when ordered (older orders don't have it)
        }
    ],
    amount:{type:Number, required:true},
    tax:{type:Number, required:true},
    shipping:{type:Number, required:true},
    currency:{type:String, default:"INR"},
    // Online = Razorpay; COD = cash on delivery, stays "Pending" until the admin marks it delivered
    paymentMethod:{type:String, enum:PAYMENT_METHODS, default:"Online"},
    status:{type:String, enum:["Pending", "Paid", "Failed"], default:"Pending"},   // payment status
    // fulfilment status, managed by the admin (separate from payment)
    orderStatus:{type:String, enum:ORDER_STATUSES, default:"Processing"},
    shippedAt:{type:Date},
    deliveredAt:{type:Date},
    cancelledAt:{type:Date},
    cancelledBy:{type:String, enum:["customer", "admin"]},
    cancelReason:{type:String},
    shippingAddress:{
        fullName:String,
        phone:String,
        email:String,
        address:String,
        city:String,
        state:String,
        zip:String,
        country:String,
    },

    //Razorpay fields
    razorpayOrderId:{type:String},
    razorpayPaymentId:{type:String},
    razorpaySignature:{type:String},
    }, {timestamps:true})

    export const Order = mongoose.model("Order", orderSchema)
