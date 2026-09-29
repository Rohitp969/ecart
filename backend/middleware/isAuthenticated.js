import jwt from "jsonwebtoken"
import { User } from "../models/userModel.js"


export const isAuthenticated = async (req, res, next)=>{
    try {
        const authHeader = req.headers.authorization

        // 401 on every auth failure so the frontend can log the user out and send them to login
        if(!authHeader || !authHeader.startsWith('Bearer ')){
             return res.status(401).json({
             success:false,
            message: "Please login first"
              })
    }
     const token = authHeader.split(" ")[1]
     let decoded
     try {
        decoded = jwt.verify(token, process.env.SECRET_KEY)
     } catch (error) {
        if(error.name === "TokenExpiredError"){
          return res.status(401).json({
             success:false,
            message: "Session expired, please login again"
              })
    }
    return res.status(401).json({
             success:false,
            message: "Invalid session, please login again"

              })
     }
       const user = await User.findById(decoded.id)
       if(!user){
        return res.status(401).json({
             success:false,
            message: "User not found, please login again"

              })
       }
       req.user = user
       req.id = user._id
       next()
    } catch (error) {
         return res.status(500).json({
             success:false,
            message: error.message

              })
    }
 }


 export const isAdmin = (req, res, next)=>{
   if(req.user && req.user.role === 'admin'){
     next()
   }else{
     return res.status(403).json({
       message: "Access denied: admin only"
     })
   }
 
 }
