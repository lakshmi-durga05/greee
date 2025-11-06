import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const CaptainSchema=mongoose.Schema({
    fullname:{
        firstname:{
            type:String,
            required:true,
            minlength:[3,'First name should contain 3 or more characters']
        },
        lastname:{
            type:String,
            minlength:[3,'Last name should contain 3 or more characters']
        }
    },
    email:{
        type:String,
        unique:true,
        lowercase:true,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        minlength:[3,'Password should contain 3 or more characters'],
        select:false
    },
    socketId:{
        type:String
    },
    vehicle:{
        color:{
            type:String,
            required:true,
            minlength:[3,'color should contain 3 or more characters']
        },
        plate:{
            type:String,
            required:true,minlength:[3,'Plate should contain 3 or more characters']
        },
        capacity:{
            type:Number,
            default:[1,"Capacity should be 1 or more"],
            required:true
        },
        vehicleType:{
            type:String,
            enum:['Motorcycle','Car','Auto'],
            required:true
        }

    },
    status:{
        type:String,
        enum:['inactive','active'],
        default:'inactive'
    },
    location:{
        lat:{
            type:Number
        },
        lng:{
            type:Number
        }
    },
    rating:{
        type:String,
        default:"3.5"
    },
    lastSeen:{
        type:Number
    }

})
CaptainSchema.methods.generateAuthToken=function(){
    const token = jwt.sign({_id:this._id},process.env.TOKEN_SECRET,{expiresIn:"24h"})
    return token
}
//This refers to current password 
//if not modified then go to next function
CaptainSchema.pre('save',async function(next) {
  if(!this.isModified('password')) return next()
    
    const hashedPass=await bcrypt.hash(this.password,12);
    this.password=hashedPass
    next()
})

CaptainSchema.methods.checkPassword=async function (password) {
    return await bcrypt.compare(password,this.password)
}



export const CaptainModel=mongoose.model('Captain',CaptainSchema)
