import mongoose from "mongoose";

export const COUPON_TYPES = ["percent", "flat"];

// Discount codes created from Admin → Coupons and applied by customers at checkout
const couponSchema = new mongoose.Schema({
    code:{type:String, required:true, unique:true, uppercase:true, trim:true},
    description:{type:String, trim:true},
    type:{type:String, enum:COUPON_TYPES, default:"percent"},
    value:{type:Number, required:true, min:0},     // percent (1-90) or rupees
    minOrder:{type:Number, default:0, min:0},      // order subtotal needed to use the code
    maxDiscount:{type:Number, min:0},              // cap for percent codes (empty = no cap)
    expiresAt:{type:Date},
    usageLimit:{type:Number, min:0},               // total uses allowed (empty = unlimited)
    usedCount:{type:Number, default:0},
    active:{type:Boolean, default:true},
}, {timestamps:true})

export const Coupon = mongoose.model("Coupon", couponSchema)
