import { blackListModel } from "../models/blacklistToken-model.js";
import { CaptainModel } from "../models/captain-model.js";
import { userModel } from "../models/user-model.js";
import { asyncHandler } from "../utils/Asynchandler.js";
import jwt from "jsonwebtoken";

export const authmiddlewareUser=async (req,res,next) => {
    try {
        if (process.env.DISABLE_AUTH === 'true') {
            req.user = { _id: 'dev-user', role: 'user' };
            return next();
        }
        const token= req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        if(!token){
            return res.status(401).json({
                message:"Token not found"
            });
        }
        const isTokenBlacklisted=await blackListModel.findOne({token})

        if(isTokenBlacklisted){
            return res.status(401).json({
                message:"Token not valid"
            });
        }
        let verifyToken;
        try {
            verifyToken = jwt.verify(token,process.env.TOKEN_SECRET);
        } catch (e) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user=await userModel.findById(verifyToken._id).select('-__v')
        if(!user){
            return res.status(401).json({
                message:"User not found"
            })
        }
        req.user=user
        next()
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message:"Unauthorized"
        })
    }
}


export const authmiddlewareCap=async (req,res,next) => {
    try {
        if (process.env.DISABLE_AUTH === 'true') {
            req.captain = { _id: 'dev-captain', role: 'captain' };
            return next();
        }
        const token=req.headers.authorization?.split(' ')[1] || req.cookies?.token 
    
        if(!token){
            return res.status(401).json({ message:"Token not found" })
        }
    
        const isTokenBlacklisted=await blackListModel.findOne({token})
    
      
        if(isTokenBlacklisted){
            return res.status(401).json({ message:"Token not valid" })
        }
    
        let verifyToken;
        try {
            verifyToken = jwt.verify(token,process.env.TOKEN_SECRET)
        } catch (e) {
            return res.status(401).json({ message:"Unauthorized user" })
        }
    
        const captain=await CaptainModel.findById(verifyToken._id).select('-__v')
        if(!captain){
            return res.status(401).json({ message:"Unauthorized user" })
        }
        req.captain=captain
        next()
    } catch (error) {
        return res.status(401).json({ message:"Unauthorized user" })
    }
}