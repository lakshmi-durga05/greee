import { blackListModel } from "../models/blacklistToken-model.js";
import { CaptainModel } from "../models/captain-model.js";
import { RideModel } from "../models/ride-schema.js";
import { asyncHandler } from "../utils/Asynchandler.js";
import { validationResult } from "express-validator";


export const registerCaptain=asyncHandler(async (req,res) => {
    const errors=validationResult(req)
    //Handling the express validator errors
    if(!errors.isEmpty()){
        return res.status(400)
        .json({
            errors:errors.array()
        })
    }

    const {
        fullname,
        email,
        password,
        phone,
       vehicle
    }=req.body

    if( !fullname.firstname  || !email  ||!password || !phone || !vehicle){
        throw new Error("All fields are required")
    }
    const existedCap=await CaptainModel.findOne({email})
    if(existedCap){
        return res.status(400).json({
            message:"Captain already exists",
            existedCap
        })
    }
    const newCap=await CaptainModel.create({
        fullname:{
            firstname:fullname.firstname,
            lastname:fullname.lastname
        },
        email,
        phone,
        password,
        vehicle:{
           color:vehicle.color,
            plate:vehicle.plate,
            capacity:vehicle.capacity,
            vehicleType:vehicle.vehicleType
        }
    })
    return res.status(201).json({
        message:"Captain created",
        newCap
    })


})

// Return only online/joined captains filtered by vehicleType
export const getOnlineCaptains = asyncHandler(async (req, res) => {
    const { vehicleType, lat, lng, radiusKm } = req.query
    if (!vehicleType) {
        return res.status(400).json({ message: 'vehicleType is required' })
    }

    // Consider a captain online if they have a socketId
    const parseNum = (v)=>{
        const n = Number(v)
        return Number.isFinite(n) ? n : undefined
    }
    const pLat = parseNum(lat)
    const pLng = parseNum(lng)
    const rKm = parseNum(radiusKm)

    const caps = await CaptainModel.find({
        'vehicle.vehicleType': { $regex: `^${vehicleType}$`, $options: 'i' },
        socketId: { $exists: true, $ne: null },
    }).lean()

    const toRad = (d)=> d * Math.PI / 180
    const haversine = (a, b)=>{
        if(a==null || b==null) return undefined
        const R=6371
        const dLat = toRad((b.lat - a.lat))
        const dLng = toRad((b.lng - a.lng))
        const s1 = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2
        const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1-s1))
        return R*c
    }

    let online = caps
        .filter(c => {
            // If client provided lat/lng, require captain to have a location for distance calc
            if (pLat!=null && pLng!=null) {
                return c?.location && typeof c.location.lat === 'number' && typeof c.location.lng === 'number'
            }
            // Otherwise, include all online captains regardless of whether they've shared location yet
            return true
        })
        .map(c => {
            const distanceKm = (pLat!=null && pLng!=null && c?.location) ? haversine({lat:pLat,lng:pLng}, {lat:c.location.lat,lng:c.location.lng}) : undefined
            const etaMin = distanceKm!=null ? Math.max(1, Math.round((distanceKm/25)*60)) : undefined // 25 km/h avg
            return ({
                _id: c._id,
                fullname: c.fullname,
                vehicle: c.vehicle,
                socketId: c.socketId,
                location: c.location,
                distanceKm,
                etaMin
            })
        })

    if(pLat!=null && pLng!=null){
        online = online
            .filter(c=> c.distanceKm!=null && (rKm==null || c.distanceKm <= rKm))
            .sort((a,b)=> a.distanceKm - b.distanceKm)
    }

    return res.status(200).json({ captains: online })
})


export const loginCaptain =asyncHandler(async (req,res,next) => {
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({
            error:errors.array()
        })
    }
    const {email,password}=req.body

    if(!email ||!password){
        throw new Error("All fields are required")
    }

    const captain=await CaptainModel.findOne({email}).select('+password')
    if(!captain){
        return res.status(400).json({
            message:"Captain not found"
        })
    }

    const checkPassword=await captain.checkPassword(password)

    if(!checkPassword){
        return res.status(400).json({
            message:"Incorrect password"
        }) 
    }

    const token = captain.generateAuthToken()
    return res.status(200)
    .json({
        message:"Captain login successful",
        token,
        captain: {
            _id: captain._id,
            email: captain.email,
            fullname: captain.fullname
        }
    })
})


export const getCapProfile=asyncHandler(async (req,res) => {
    const cap=req.captain
    res.status(200).json({
        cap
    })
})


export const logoutCap=asyncHandler(async (req,res) => {
    const token=req.headers.authorization?.split(' ')[1] || req.cookies.token 
    const options={
        httpOnly:true,
        secure:true
    }
    await blackListModel.create({token})
    res.clearCookie(token,options)
    res.status(200).json({
        message:"Logout Success"
    })
})


