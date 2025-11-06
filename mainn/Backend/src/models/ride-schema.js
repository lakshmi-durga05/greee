
import mongoose, { mongo } from "mongoose";


const rideSchema=new mongoose.Schema({
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    Captain:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Captain'
    },
    pickup:{
        type:String,
        required:true
    },
    destination:{
        type:String,
        required:true
    },
    fare:{
        type:Number,
        required:true
    },
    duration:{
        type:Number
    },// In Minutes
    distance:{
        type:Number
    },//In Km
    paymentType:{
        type:String,
        enum:['cash','online'],
    },
    signature:{
        type:String
    },
    orderId:{
        type:String
    },
    status:{
        type:'String',
        enum:['pending','accepted','completed','cancelled','ongoing'],
        default:'pending'
    },
    otp:{
        type:String,
        required:true
    },
    policeAlert:{
        reason:{
            type:String
        },
        callMade: {
            type: Boolean,
            default: false // Default value can be false initially
        }
    }
},{timestamps:true})





export const RideModel=mongoose.model('Rides',rideSchema)

