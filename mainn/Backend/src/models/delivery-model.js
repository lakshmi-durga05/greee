import mongoose from "mongoose";

const DeliverySchema=mongoose.Schema({
    Captain:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Captain"
    },
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    pickup:{
        type:String,
        required:true
    },
    drop:{
        type:String,
        required:true
    },
    fees:{
        type:String,
        required:true,

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
    deliveryId:{
        type:String,
        required:true
    },
    status:{
        type:'String',
        enum:['pending','accepted','delivered','ongoing'],
        default:'pending'
    },
    otp:{
        type:String,
        required:true
    },
    rating:{
        type:String
    }
},{timestamps:true})

export const DeliveryModel=mongoose.model('Deliveries',DeliverySchema)