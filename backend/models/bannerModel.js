import mongoose from "mongoose";

export const BANNER_PLACEMENTS = ["hero", "promo"];

// Home page banners managed from Admin → Banners.
// hero: the big slider at the top; promo: the three smaller cards further down.
const bannerSchema = new mongoose.Schema({
    placement:{type:String, enum:BANNER_PLACEMENTS, default:"hero"},
    title:{type:String, required:true, trim:true},
    eyebrow:{type:String, trim:true},        // small label above the title (hero)
    text:{type:String, trim:true},           // one line under the title (hero)
    buttonText:{type:String, trim:true},
    link:{type:String, trim:true, default:"/products"},
    theme:{type:String, trim:true},          // colour preset, see frontend/src/lib/banners.js
    image:{
        url:{type:String, required:true},
        public_id:{type:String},
    },
    position:{type:Number, default:0},       // lower comes first
    active:{type:Boolean, default:true},
}, {timestamps:true})

export const Banner = mongoose.model("Banner", bannerSchema)
