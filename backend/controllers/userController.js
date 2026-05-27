import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { verifyEmail } from "../emaiVerify/verifyEmail.js";
import { Session } from "../models/sessionModel.js";
import { sendOTPMail } from "../emailVerify/sendOtpMail.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";


export const register = async(req, res)=>{
    try {
       const {firstName, lastName, email, password} = req.body;
       if(!firstName || !lastName || !email || !password){
       return res.status(400).json({
            success:false,
            message:'All fields are required'
        })
       } 
       const user = await User.findOne({email})
       if(user){
       return res.status(400).json({
            success:false,
            message: 'User already exists'
        })
       }
       const hashedPassword = await bcrypt.hash(password, 10)
       const newUser = await User.create({
        firstName, lastName, email, password: hashedPassword, isVerified: true
       })
       const token = jwt.sign({id:newUser._id}, process.env.SECRET_KEY, {expiresIn:'10m'})
       verifyEmail(token, email)
       newUser.token = token
       await newUser.save()
       return res.status(201).json({
        success: true,
        message: 'User registered  successfully',
        user:newUser
       })

    } catch (error) {
      return  res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const verify = async(req, res)=>{
    try {
        const authHeader = req.headers.authorization
        if(!authHeader || !authHeader.startsWith("Bearer ")){
          res.status(400).json({
            success:false,
            message:'Authorization token is missing oe invalid'
          })  
        }
        const token = authHeader.split(" ")[1]
        let decoded
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY)
        } catch (error) {
           if(error.name === "TokenExpiredError"){
            return res.status(400).json({
                 success:false,
            massege:'The registration token has expired'
            })
           }
           return res.status(400).json({
             success:false,
            massege:"Token verification failed"
           })
        }
        const user = await User.findById(decoded.id)
        if(!user){
            return res.status(400).json({
             success:false,
            massege:"User not found"
           })
        }
        user.token = null
        user.isVerified = true
        await user.save()
        return res.status(400).json({
             success:true,
            massege:"Email verified successfully"
           })
    } catch (error) {
        res.status(400).json({
             success:false,
            massege:error.massege
           })
    }
}

export const reVerify = async(req, res)=>{
    try {
        const {email} = req.body;
        const user = await User.findOne({email})
        if(!user){
              res.status(400).json({
             success:false,
            massege:"User not found"
              })
        }
        const token = jwt.sign({id:user._id}, process.env.SECRET_KEY, {expiresIn:'10m'})
       verifyEmail(token, email)
       user.token = token
       await user.save()
       return res.status(200).json({
             success:true,
            massege:"verification email send again successfully",
            token: user.token
              })
    } catch (error) {
        return res.status(500).json({
             success:false,
            massege:error.massege
              })
    }
}

//login user
export const login = async(req, res)=>{
    try {
        const {email, password} = req.body
       if(!email || !password){
        return res.status(400).json({
             success:false,
            massege:"All failds are required"
        })
       }
       const existingUser = await User.findOne({email})
            if(!existingUser){
        return res.status(400).json({
             success:false,
            massege:"User not exists"
        })
       }
       const isPasswordValid = await bcrypt.compare(password, existingUser.password) 
            if(!isPasswordValid){
        return res.status(400).json({
             success:false,
            massege:"Invalid Credential"
        })
       }
            if(existingUser.isVerified === false){
        return res.status(400).json({
             success:false,
            massege:"verify your account than login"
        })
       }

       //generate token//

       const accessToken = jwt.sign({id:existingUser._id}, process.env.SECRET_KEY, {expiresIn:'10d'})
       const refreshToken = jwt.sign({id:existingUser._id}, process.env.SECRET_KEY, {expiresIn:'30d'})

       existingUser.isLoggedIn = true;
       await existingUser.save();

//check for exisiting session and delele if//
       const existingSession = await Session.findOne({userId:existingUser._id})
       if(existingSession){
        await Session.deleteOne({userId:existingUser._id})
       }
      
       //create a new session
       await Session.create({userId:existingUser._id})
        return res.status(200).json({
             success:true,
            massege:`Welcome back ${existingUser.firstName}`,
            user:existingUser,
            accessToken,
            refreshToken
        })
    } catch (error) {
        return res.status(500).json({
             success:false,
            message: error.message

              })
    }
}

export const logout = async(req, res)=>{
    try {
        const userId = req.id
        await Session.deleteMany({userId:userId})
        await User.findByIdAndUpdate(userId, {isLoggedIn:false})
        return res.status(200).json({
             success:true,
            message: "User logged out successfully "

              })
    } catch (error) {
       return res.status(500).json({
             success:false,
            message: error.message
              }) 
    }
}

//Forgot password//
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // ✅ CORRECT FUNCTION CALL
    await sendOTPMail(otp, email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const verifyOTP = async(req, res)=>{
    try {
        const {otp} = req.body;
        const email = req.params.email
        if(!otp){
               return res.status(400).json({
             success:false,
            message: "Otp is required"
              })  
        }
        const user = await User.findOne({email})
        if(!user){
               return res.status(400).json({
             success:false,
            message: "User not found"
              })  
        }
        if(!user.otp || !user.otpExpiry){
           return res.status(500).json({
             success:false,
            message: "OTP is not ganerated or already verified"
        })
      }
        if(user.otpExpiry < new Date()){
           return res.status(400).json({
             success:false,
            message: "otp has expired please request a new one"
        })  
        }
        if(otp != user.otp){
           return res.status(400).json({
             success:false,
            message: "Otp is invalid"
        })  
      }
      user.otp = null
      user.otpExpiry = null
      await user.save()  
       return res.status(200).json({
             success:true,
            message: "Otp verified successfully"
        })  
    } catch (error) {
       return res.status(500).json({
             success:false,
            message: error.message
        })  
    }
}

export const changePasssword = async(req, res)=>{
  try {
    const {newPassword, confirmPassword} = req.body;
    const {email} = req.params
    const user = await User.findOne({email})
    if(!user){
       return res.status(500).json({
             success:false,
            message: "User not found"
        })  
    }
    if(!newPassword || !confirmPassword){
       return res.status(400).json({
             success:false,
            message: "All fields are required"
        })  
    }
    if(newPassword !==confirmPassword){
        return res.status(400).json({
             success:false,
            message:"password do not match "
        }) 
    }
    const hashedPassword =await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
     return res.status(200).json({
             success:true,
            message:"password change successfully "
        })  
  } catch (error) {
     return res.status(500).json({
             success:false,
            message: error.message
        })  
  }
}


export const allUser = async(__, res)=>{
  try {
    const users = await User.find()
     return res.status(200).json({
             success:true,
            users
        }) 
  } catch (error) {
     return res.status(500).json({
             success:false,
            message: error.message
        }) 
  }
}


export const getUserById = async(req, res)=>{
  try {
    const {userId} = req.params;  //extract userId from request params//
    const user = await User.findById(userId).select("-password -otp -otpExpiry -token")
    if(!user){
       return res.status(404).json({
             success:false,
            message: "User not found"
        }) 
    }
     return res.status(200).json({
             success:true,
            user,
        }) 
  } catch (error) {
     return res.status(500).json({
             success:false,
            message: error.message
        }) 
  }
}


export const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id  //the ID of the user want to updateUser
    const isLoggedInUser = req.user       //from isAuthenticated middleware
    const { firstName, lastName, address, phoneNo, city, zipCode, role } = req.body

    if(isLoggedInUser._id.toString() !== userIdToUpdate && isLoggedInUser.role !== 'admin')
    {
        return res.status(403).json({
             success:false,
            message: "You are not allowed to update this profile"
        }) 
    }

    let user = await User.findById(userIdToUpdate);
    if(!user){
        return res.status(500).json({
             success:false,
            message: "User not found"
        }) 
    }

    let profilePicUrl = user.profilePic;
    let profilePicPublicId = user.profilePicPublicId

    //if a new file is uploaded 
    if(req.file){
      if(profilePicPublicId){
        await cloudinary.uploader.destroy(profilePicPublicId)
      }
      const uploadResult = await new Promise((resolve, reject)=>{
        const Stream = cloudinary.uploader.upload_stream(
          {folder:"profiles"},
          (error, result) =>{
            if (error) reject(error)
              else resolve(result)
          }
        )
        Stream.end(req.file.buffer)
      })
      profilePicUrl = uploadResult.secure_url;
      profilePicPublicId = uploadResult.public_id
    }

    //update file
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.zipCode = zipCode || user.zipCode;
    user.phoneNo = phoneNo || user.phoneNo;
    user.role = role;
    user.profilePic = profilePicUrl;
    user.profilePicPublicId = profilePicPublicId

    const updateUser = await user.save()

      return res.status(200).json({
             success:true,
            message: "Profile Updated Successfully",
            user:updateUser
        })

  } catch (error) {
    console.log(error);
      return res.status(500).json({
             success:false,
            message: error.message
        }) 
  }
}
