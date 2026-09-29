import mongoose from "mongoose";

// Newsletter sign-ups from the store footer
const subscriberSchema = new mongoose.Schema({
    email:{type:String, required:true, unique:true, lowercase:true, trim:true},
}, {timestamps:true})

export const Subscriber = mongoose.model("Subscriber", subscriberSchema)
