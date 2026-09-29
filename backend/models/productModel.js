import mongoose, { Types } from "mongoose";

const productSchema = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }, 
        productName: {type: String, require: true},
        productDesc: {type: String, require: true},

        productImg:[
            {
            url: {type: String, require: true},
            public_id: {type: String, require: true},
            }
        ],
        productPrice:{type:Number},
        category:{type:String},
        brand:{type:String},
        rating:{type:Number, default:0},              // 0-5, 0 = not rated yet
        discountPercentage:{type:Number, default:0},  // MRP = price / (1 - discount/100)
        stock:{type:Number}                           // unset = unknown (treated as in stock)
    },
    {timestamps: true

    }
)

export const Product = mongoose.model("Product", productSchema);