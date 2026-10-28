import mongoose from "mongoose";

// Store-wide settings edited from Admin → Store settings. There is a single document (key "store");
// these defaults apply until the admin saves the form for the first time.
const DEFAULT_SETTINGS = {
    supportEmail: "support@ekart.com",
    supportPhone: "(123) 456-7890",
    address: "123 Electronics St, Style City, NY 10001",
    supportHours: "Mon – Sat, 9:00 AM – 9:00 PM",
    shippingFee: 49,
    freeShippingAbove: 299,
    taxRate: 5,             // percent
    returnWindowDays: 30,
    codEnabled: true,
}

const settingsSchema = new mongoose.Schema({
    key:{type:String, default:"store", unique:true},
    supportEmail:{type:String, trim:true},
    supportPhone:{type:String, trim:true},
    address:{type:String, trim:true},
    supportHours:{type:String, trim:true},
    shippingFee:{type:Number, min:0},
    freeShippingAbove:{type:Number, min:0},
    taxRate:{type:Number, min:0, max:50},
    returnWindowDays:{type:Number, min:0},
    codEnabled:{type:Boolean},
}, {timestamps:true})

export const Settings = mongoose.model("Settings", settingsSchema)

// Saved settings over the defaults (fields the admin never set keep their default)
export const getStoreSettings = async () => {
    const saved = await Settings.findOne({ key: "store" }).lean()
    const settings = { ...DEFAULT_SETTINGS }
    for (const field of Object.keys(DEFAULT_SETTINGS)) {
        if (saved?.[field] !== undefined && saved[field] !== null) settings[field] = saved[field]
    }
    return settings
}
