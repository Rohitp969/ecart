import mongoose from "mongoose";

// keep in sync with CONTACT_TOPICS in frontend/src/lib/help.js
export const CONTACT_TOPICS = ["Order issue", "Returns & refunds", "Payment", "Product question", "Account", "Other"];
export const MESSAGE_STATUSES = ["New", "Resolved"];

// "Contact Us" form submissions, answered from the admin panel
const contactMessageSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    email:{type:String, required:true, lowercase:true, trim:true},
    phone:{type:String, trim:true},
    topic:{type:String, enum:CONTACT_TOPICS, default:"Other"},
    orderId:{type:String, trim:true},
    message:{type:String, required:true, trim:true},
    status:{type:String, enum:MESSAGE_STATUSES, default:"New"},
}, {timestamps:true})

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema)
