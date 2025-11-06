import mongoose from "mongoose";

const blackListSchema=mongoose.Schema(
    {
        token:{
            type:String,
            unique:true,
            required:true
        },
        createdAt:{
            type:Date,
            default:Date.now,
            expires:86400//24 hours 
        }
    }
)

export const blackListModel=mongoose.model('BlackListToken',blackListSchema)
//2 factor cheking like if user logs out then if somebody tries to access the details using the same token 
//So therefore created this model in which once user logs out then token will be blacklisted
//Also will be implmented in authMiddleware