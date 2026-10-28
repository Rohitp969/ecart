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
    // email verified with the 6-digit code from signup; only verified accounts can log in
     isVerified:{
         type: Boolean,
       default: false
    },
    // signup verification code: only its hash is kept, valid 5 minutes, 5 wrong tries max
    emailOtp:{
         type: String,
       default: null
    },
    emailOtpExpiry:{
         type: Date,
       default: null
    },
    emailOtpAttempts:{
         type: Number,
       default: 0
    },
    // when the last code was sent (30s resend cooldown)
    emailOtpSentAt:{
         type: Date,
       default: null
    },
    // set by an admin (Admin → Users); a blocked account can't sign in
    isBlocked:{
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
    // when the last password-reset code went out (resend cooldown)
    otpSentAt:{
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