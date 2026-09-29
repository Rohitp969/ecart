import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { Order } from "../models/orderModel.js";
import cloudinary from "../utils/cloudinary.js";
import { publicUser } from "./authController.js";

// Signup, login, email verification and password reset live in authController.js

// Signed-in user changes their password from the account page (needs the current one)
export const updatePassword = async(req, res)=>{
  try {
    const {currentPassword, newPassword} = req.body
    if(!currentPassword || !newPassword){
       return res.status(400).json({
             success:false,
            message: "All fields are required"
        })
    }
    if(typeof newPassword !== "string" || newPassword.length < 6){
       return res.status(400).json({
             success:false,
            message: "New password must be at least 6 characters"
        })
    }
    const user = await User.findById(req.id)
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if(!isPasswordValid){
       return res.status(400).json({
             success:false,
            message: "Current password is incorrect"
        })
    }
    if(await bcrypt.compare(newPassword, user.password)){
       return res.status(400).json({
             success:false,
            message: "New password must be different from the current one"
        })
    }
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    return res.status(200).json({
             success:true,
            message: "Password updated successfully"
        })
  } catch (error) {
     return res.status(500).json({
             success:false,
            message: error.message
        })
  }
}


const PRIVATE_FIELDS = "-password -otp -otpExpiry -otpAttempts -otpSentAt -token -verificationSentAt -passwordResetToken -passwordResetExpiry"

export const allUser = async(__, res)=>{
  try {
    const [users, orderStats] = await Promise.all([
      User.find().select(PRIVATE_FIELDS).sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        {
          $group: {
            _id: "$user",
            orders: { $sum: 1 },
            spent: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0] } },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
      ]),
    ])
    const statsByUser = new Map(orderStats.map((s) => [String(s._id), s]))
     return res.status(200).json({
             success:true,
            users: users.map((user) => {
              const stats = statsByUser.get(String(user._id))
              return {
                ...user,
                orders: stats?.orders || 0,
                spent: Math.round(stats?.spent || 0),
                lastOrderAt: stats?.lastOrderAt || null,
              }
            })
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
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
       return res.status(403).json({
             success:false,
            message: "You are not allowed to view this profile"
        })
    }
    const user = await User.findById(userId).select(PRIVATE_FIELDS)
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
    // only an admin may change roles; otherwise keep the existing one
    if (isLoggedInUser.role === 'admin' && role) {
      user.role = role;
    }
    user.profilePic = profilePicUrl;
    user.profilePicPublicId = profilePicPublicId

    const updateUser = await user.save()

      return res.status(200).json({
             success:true,
            message: "Profile Updated Successfully",
            user:publicUser(updateUser)
        })

  } catch (error) {
    console.log(error);
      return res.status(500).json({
             success:false,
            message: error.message
        }) 
  }
}
