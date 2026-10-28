import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { Order } from "../models/orderModel.js";
import cloudinary from "../utils/cloudinary.js";
import { publicUser } from "./authController.js";
import mongoose from "mongoose";
import { Cart } from "../models/cartModel.js";
import { Session } from "../models/sessionModel.js";
import { Subscriber } from "../models/subscriberModel.js";

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


// token / verificationSentAt only exist on accounts from the old verification-link flow
const PRIVATE_FIELDS = "-password -otp -otpExpiry -otpAttempts -otpSentAt -emailOtp -emailOtpExpiry -emailOtpAttempts -emailOtpSentAt -token -verificationSentAt -passwordResetToken -passwordResetExpiry"

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

    let user = mongoose.isValidObjectId(userIdToUpdate) ? await User.findById(userIdToUpdate) : null;
    if(!user){
        return res.status(404).json({
             success:false,
            message: "User not found"
        })
    }

    // Role changes (admins only, checked before any photo upload). Admins can't change their own
    // role, so the admin making a change always remains: the store can't end up with no admin.
    const changingRole = isLoggedInUser.role === 'admin' && role && role !== user.role
    if (changingRole) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: "Choose a valid role" })
      }
      if (String(user._id) === String(isLoggedInUser._id)) {
        return res.status(400).json({ success: false, message: "You can't change your own role" })
      }
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
    if (changingRole) {
      user.role = role;
      // admins can't be blocked, so a promoted account is unblocked too
      if (role === 'admin') user.isBlocked = false;
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

// Admin: block or unblock a customer. Blocked accounts can't sign in and are signed out on their next request.
export const setUserBlocked = async (req, res) => {
  try {
    const user = mongoose.isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null
    if (!user) return res.status(404).json({ success: false, message: "User not found" })
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You can't block your own account" })
    }
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Admins can't be blocked. Change their role to customer first." })
    }
    user.isBlocked = Boolean(req.body.blocked)
    if (user.isBlocked) {
      user.isLoggedIn = false
      await Session.deleteMany({ userId: user._id })
    }
    await user.save()
    return res.status(200).json({
      success: true,
      message: user.isBlocked ? `${user.firstName} has been blocked` : `${user.firstName} has been unblocked`,
      user: publicUser(user),
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: delete a customer account. Their orders stay for the store's records (shown as "Deleted user").
export const deleteUserByAdmin = async (req, res) => {
  try {
    const user = mongoose.isValidObjectId(req.params.id) ? await User.findById(req.params.id) : null
    if (!user) return res.status(404).json({ success: false, message: "User not found" })
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You can't delete your own account here" })
    }
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Admins can't be deleted. Change their role to customer first." })
    }
    if (user.profilePicPublicId) {
      await cloudinary.uploader.destroy(user.profilePicPublicId).catch(() => {})
    }
    await Promise.all([
      Cart.deleteOne({ userId: user._id }),
      Session.deleteMany({ userId: user._id }),
      Subscriber.deleteOne({ email: user.email.toLowerCase() }),
    ])
    await user.deleteOne()
    return res.status(200).json({ success: true, message: `${user.firstName} ${user.lastName}'s account has been deleted` })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
