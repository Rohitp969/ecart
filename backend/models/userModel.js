import mongoose, { Types } from "mongoose";

// saved delivery address (address book used at checkout)
const addressSchema = new mongoose.Schema({
    fullName:{type:String, required:true},
    phone:{type:String, required:true},
    email:{type:String},
    address:{type:String, required:true},
    city:{type:String, required:true},
    state:{type:String, required:true},
    zip:{type:String, required:true},
    country:{type:String, default:"India"},
    isDefault:{type:Boolean, default:false},
})

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        require: true
    },
    lastName:{
        type: String,
        require: true
    },
    profilePic:{
       type: String,
       default:"" 
    },
    profilePicPublicId:{
         type: String,
       default:"" 
    },
    email:{
        type: String,
        require: true,
        unique: true
    },
    password:{
         type: String,
        require: true,
    },
    role:{
         type: String,
         enum:["user", "admin"],
       default:"user" 
    },
    token:{
         type: String,
       default: null 
    },
     isVerified:{
         type: Boolean,
       default: false
    },
     isLoggedIn:{
         type: String,
       default: null 
    },
    otp:{
         type: String,
       default: null 
    },
    otpExpiry:{
         type: Date,
       default: null
    },
    // wrong OTP guesses since the last OTP was sent (locked after 5)
    otpAttempts:{
         type: Number,
       default: 0
    },
    // when the last OTP / verification mail went out (resend cooldown)
    otpSentAt:{
         type: Date,
       default: null
    },
    verificationSentAt:{
         type: Date,
       default: null
    },
    // hash of the one-time token handed out after a correct OTP
    passwordResetToken:{
         type: String,
       default: null
    },
    // set after a successful OTP check; password can be changed only until this time
    passwordResetExpiry:{
         type: Date,
       default: null
    },
    address:{
        type: String
    },
    city:{
        type: String
    },
    zipCode:{
        type: String
    },
    phoneNo:{
        type: String
    },
    addresses:{
        type:[addressSchema],
        default:[]
    }
}, {timestamps:true})

export const User = mongoose.model("User", userSchema)