import axios from "axios";
import mongoose from 'mongoose'
import { CaptainModel } from "../models/captain-model.js";
import { DeliveryModel } from "../models/delivery-model.js";
import { RideModel } from "../models/ride-schema.js";
import { userModel } from "../models/user-model.js";
import { asyncHandler } from "../utils/Asynchandler.js";
import { sendMessage } from "../utils/GlobalSocket.js";
import { getLatLng, getSuggestion } from "../utils/MapServices.js";
import { calcFare, calcFine, generateOtp, getNearbyCaptains } from "../utils/RideServices.js";
import { validationResult } from "express-validator";
import { sendRideOtpEmail } from "../utils/Notifier.js";
import { publishEvent } from "../kafka/kafka.js";
import { sendRideOtpSms } from "../utils/SmsNotifier.js";




export const createRide=asyncHandler(async (req,res) => {
   const  validationErr=validationResult(req)
   if(!validationErr.isEmpty()){
   return res.status(400) 
    .json({
        error:validationErr.array()
    })
   }
    let {
        pickUp,
        drop,
        vehicleType,
        captainId
    }=req.body
    const user=req.user
    if(!pickUp || !drop || !vehicleType){
        throw new Error('Provide all information')
    }
    // Resolve a valid userId to use (supports dev mode where _id may be 'dev-user')
    let userIdToUse = (user && mongoose.isValidObjectId(user._id)) ? user._id : null
    if (!userIdToUse) {
        if (process.env.DISABLE_AUTH === 'true') {
            const anyUser = await userModel.findOne({}, {_id:1}).lean()
            if (anyUser && anyUser._id) {
                userIdToUse = anyUser._id
            } else {
                return res.status(401).json({ message: 'Unauthorized: no valid user found' })
            }
        } else {
            return res.status(401).json({ message: 'Unauthorized: user token invalid or expired' })
        }
    }
  
    // Fuzzy normalize pickup
    // Prefer using a 6-digit pincode from the pickup address as OTP for now (temporary requirement)
    let otp
    try{
        const pinMatch = (pickUp || '').match(/\b\d{6}\b/)
        otp = pinMatch ? pinMatch[0] : generateOtp(6)
    }catch{ otp = generateOtp(6) }
  
  
  
    // First getting the latitudes and longitudes from pickup 
    let getPickup
    try{
        getPickup = await getLatLng(pickUp)
    }catch(err){
        // ignore, we'll try a suggestion fallback below
    }
    if(!getPickup || typeof getPickup.latitude !== 'number' || typeof getPickup.longitude !== 'number'){
        // Fallback: try suggestion API (fast) and take the first result
        try{
            const sugg = await getSuggestion(pickUp, null, null, 1, true)
            if (Array.isArray(sugg) && sugg.length){
                getPickup = { latitude: parseFloat(sugg[0].lat), longitude: parseFloat(sugg[0].lng) }
                // also replace pickup text with normalized display name if available
                if (sugg[0].display_name) {
                    pickUp = sugg[0].display_name
                }
            }
        }catch(e){ /* noop */ }
    }
    if(!getPickup || typeof getPickup.latitude !== 'number' || typeof getPickup.longitude !== 'number'){
        return res.status(400).json({ message: 'Failed to geocode pickup' })
    }

    // Fuzzy normalize drop as well (for reliable fare calc)
    try{
        const d1 = await getLatLng(drop)
        if (!d1 || typeof d1.latitude !== 'number' || typeof d1.longitude !== 'number'){
            const suggD = await getSuggestion(drop, null, null, 1, true)
            if (Array.isArray(suggD) && suggD.length){
                if (suggD[0].display_name) drop = suggD[0].display_name
            }
        }
    }catch(e){ /* ignore; calcFare will still try */ }

    // Calculate fares and validate using normalized addresses
    let fareDetails
    try{
        fareDetails = await calcFare(pickUp, drop)
    }catch(err){
        return res.status(400).json({ message: 'Failed to calculate fare', error: err?.message })
    }
    const { fares } = fareDetails
    const { distanceInKm, durationInMins } = fareDetails
    // Normalize requested vehicle type (treat 'bike' as 'motorcycle')
    let vType = (vehicleType || '').toString().toLowerCase()
    if (vType === 'bike') vType = 'motorcycle'
    if(!['car','motorcycle','auto'].includes(vType)){
        return res.status(400).json({ message: 'Invalid vehicleType' })
    }
    if(!fares || typeof fares[vType] === 'undefined'){
        return res.status(400).json({ message: 'Fare not available for vehicleType' })
    }

    // Find joined captains (no radius limit) and match vehicleType OR target specific captain
    let nearbyCaptains = await getNearbyCaptains(getPickup.latitude, getPickup.longitude)
    if (captainId) {
        // Prefer sending to the selected captain if provided
        const cap = await CaptainModel.findById(captainId).lean()
        if (cap && cap.socketId) {
            // Send to targeted captain AND also broadcast to other online captains of same type (reduces missed deliveries)
            const others = await CaptainModel.find({
                'vehicle.vehicleType': { $regex: `^${vType}$`, $options: 'i' },
                socketId: { $exists: true, $ne: null },
                _id: { $ne: cap._id }
            }).lean()
            const combined = [cap, ...(Array.isArray(others) ? others : [])]
            // Deduplicate by socketId
            const seen = new Set()
            nearbyCaptains = combined.filter(c => {
                if (!c?.socketId) return false
                if (seen.has(c.socketId)) return false
                seen.add(c.socketId)
                return true
            })
        } else {
            // Stronger fallback: broadcast to ALL online captains of requested vehicleType regardless of location
            const onlineTypeCaps = await CaptainModel.find({
                'vehicle.vehicleType': { $regex: `^${vType}$`, $options: 'i' },
                socketId: { $exists: true, $ne: null },
            }).lean()
            nearbyCaptains = Array.isArray(onlineTypeCaps) ? onlineTypeCaps : []
        }
    } else if (Array.isArray(nearbyCaptains)) {
        nearbyCaptains = nearbyCaptains.filter(c => {
            const capType = (c?.vehicle?.vehicleType || '').toLowerCase()
            const normCapType = capType === 'bike' ? 'motorcycle' : capType
            return normCapType === vType
        })
    }

 


    let newRide
    try{
        newRide = await RideModel.create({
            User: userIdToUse,
            pickup: pickUp,
            destination: drop,
            vehicleType: vType,
            duration:durationInMins,
            distance:distanceInKm,
            otp:otp,
            fare: fares[vType],
        })
    }catch(e){
        return res.status(400).json({ message: 'Failed to create ride record', error: e?.message })
    }
    const newRidewithUser=await RideModel.findOne({_id:newRide._id}).populate('User')
    // Kafka: ride created
    publishEvent('rides.created', String(newRidewithUser._id), {
        rideId: String(newRidewithUser._id),
        userId: String(newRidewithUser?.User?._id || ''),
        pickup: newRidewithUser.pickup,
        destination: newRidewithUser.destination,
        vehicleType: newRidewithUser.vehicleType,
        fare: newRidewithUser.fare,
        status: newRidewithUser.status
    })
    // Do not leak OTP to captains; only user sees OTP after acceptance
    if(Array.isArray(nearbyCaptains)){
        // Only send to online captains (must have socketId)
        const onlineCaps = nearbyCaptains.filter(c=>c && c.socketId)
        onlineCaps.forEach(captain => {
            const baseObj = newRidewithUser.toObject?.() || newRidewithUser
            const { otp: _otp, ...safeObj } = baseObj // strip otp
            const payload = {
                ...safeObj,
                targetCaptainId: captainId || null
            }
            sendMessage(captain.socketId,{
                event:'new-ride',
                data: payload
            })
        })
    }
    // Notify the user with the OTP via SMS (preferred) and email (if configured)
    try{
        const phone = newRidewithUser?.User?.phone
        if (phone) {
            await sendRideOtpSms({
                to: phone,
                otp: newRidewithUser.otp,
                rideId: String(newRidewithUser._id),
                pickup: newRidewithUser.pickup,
                destination: newRidewithUser.destination
            })
        }
        const email = newRidewithUser?.User?.email
        if (email) {
            await sendRideOtpEmail({ to: email, otp: newRidewithUser.otp, rideId: String(newRidewithUser._id), pickup: newRidewithUser.pickup, destination: newRidewithUser.destination })
        }
    }catch(e){ /* non-fatal */ }
    return res.status(200).json(
        {
            message:"Ride Created",
            newRidewithUser,
            nearbyCaptains
        }
    )
})




//Controller to getFare of each type of vehicle
export const getFare=asyncHandler(async (req,res) => {
    const pickup = req.body?.pickup || req.query?.pickup
    const drop = req.body?.drop || req.query?.drop
    if(!pickup || !drop){
        return res.status(400)
        .json({
            "message":"Missing pickup or drop"
        })
    }

    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
     return   res.status(400).
        json({
            error:validationErr.array()
        })
    }

    const fareDetails = await calcFare(pickup, drop);
    const { fares } = fareDetails; // destructing the fare
    const {distanceInKm,durationInMins}=fareDetails

    return res.status(200)
    .json({
        fares,
        estimatedTime:durationInMins,
        distance:distanceInKm,

    })
})



export const confirmRide=asyncHandler(async (req,res) => {
    const {rideId}=req.body
    const captain=req.captain
    if(!rideId){
        return res.status(400).json({ message:'Ride id not found' })
    }
    // Resolve a valid captain id (supports dev mode where id may be non-ObjectId)
    let captainId = (captain && mongoose.isValidObjectId(captain._id)) ? captain._id : null
    if(!captainId){
        const anyCap = await CaptainModel.findOne({}, {_id:1}).lean()
        if(anyCap && anyCap._id) captainId = anyCap._id
    }
    if(!captainId){
        return res.status(401).json({ message:'Unauthorized: captain not found' })
    }
    // Ensure captain is active/available
    const capDoc = await CaptainModel.findById(captainId).lean()
    if(!capDoc || capDoc.status !== 'active'){
        return res.status(403).json({ message:'Captain not available' })
    }

    let updated
    try{
        // Accept only if still pending to prevent multiple acceptances
        updated = await RideModel.findOneAndUpdate(
            { _id: rideId, status: 'pending' },
            { status: 'accepted', Captain: captainId },
            { new: true }
        )
    }catch(err){
        return res.status(400).json({ message:'Failed to accept ride', error: err?.message })
    }
    if(!updated){
        return res.status(409).json({ message:'Ride not found or already accepted' })
    }

    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
    // Kafka: ride accepted
    publishEvent('rides.accepted', String(ride._id), {
        rideId: String(ride._id),
        captainId: String(ride?.Captain?._id || ''),
        userId: String(ride?.User?._id || ''),
        otp: ride.otp,
        pickup: ride.pickup,
        destination: ride.destination
    })
    if(ride?.User?.socketId){
        sendMessage(ride.User.socketId,{
            event:"accept-ride",
            data:ride,
        })
    }
    // Send OTP to captain via SMS (preferred) and also email if available
    try{
        const capPhone = ride?.Captain?.phone
        if (capPhone) {
            await sendRideOtpSms({ to: capPhone, otp: ride.otp, rideId: String(ride._id), pickup: ride.pickup, destination: ride.destination })
        }
        const capEmail = ride?.Captain?.email
        if (capEmail) {
            await sendRideOtpEmail({ to: capEmail, otp: ride.otp, rideId: String(ride._id), pickup: ride.pickup, destination: ride.destination })
        }
    }catch(e){ /* non-fatal */ }
    return res.status(200).json({ ride })
})


//THis controller will start the ride for the captain and fire the socket for user
export const startRide=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
        res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId,otp}=req.body

    if(!rideId || !otp){
        res.status(404).
        json({
            message:'Body Data missing'
        })
    }

    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')

    if(!ride){
        throw new Error("Ride not found")
    }
    if(ride.otp !== otp){
        throw new Error("Error Otp invalid")
    }

    await RideModel.findByIdAndUpdate({_id:rideId},{
        status:'ongoing'
    })

      const user=ride.User
      sendMessage(user.socketId,{
        event:'start-ride',
        data:ride
      })

      // Kafka: ride started
      publishEvent('rides.started', String(ride._id), { rideId: String(ride._id), captainId: String(ride?.Captain?._id||''), userId: String(ride?.User?._id||'') })
      return res.status(200)
      .json({
        message:"Ride Accepted and started",
        ride
      })


})


export const endRide=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
        res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId}=req.body

    if(!rideId){
        res.status(404).
        json({
            message:'Ride id missing'
        })
    }
    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
    if(!ride){
        res.status(400)
        .json({
            message:"Ride Id not found"
        })
    }

    if(ride.status!=='ongoing'){
    throw new Error('Ride not ongoing')
    }

    await RideModel.findByIdAndUpdate({_id:rideId},{
        status:'completed'
    })

    const user=ride.User
    sendMessage(ride.User.socketId,{
        event:'payment',
        data:ride
    })   

    // Kafka: ride completed
    publishEvent('rides.completed', String(ride._id), { rideId: String(ride._id) })
    return res.status(200).json({
        ride,
        message:"Ride Completed"
    })

})
export const makePayment=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
    return res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId,fare,paymentType,rating}=req.body

    if(!rideId || !fare || !paymentType || !rating){
    return res.status(404).
        json({
            message:'Ride id missing or fare missing'
        })
    }
    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
    if(!ride){
    return    res.status(400)
        .json({
            message:"Ride Id not found"
        })
    }
    const captain=ride.Captain
    await CaptainModel.findByIdAndUpdate({
        _id:captain._id
    },
    {rating:rating}
    )
    if(ride.status!=='completed'){
    throw new Error('Ride not completed')
    }

    if(ride.fare===fare)
    await RideModel.findByIdAndUpdate({_id:rideId},{
        status:'completed',
        paymentType:paymentType
    })

    // Kafka: ride paid
    publishEvent('rides.paid', String(ride._id), { rideId: String(ride._id), paymentType, rating })
    return res.status(200).json({
        ride,
        message:"Ride Completed and payment done"
    })

})

export const seeRides=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
        return res.status(400).json({
            error: validationErr.array()
        })
    }
    const { requirement: rawReq } = req.query
    const requirement = (rawReq || 'pending').toString()
    const user = req.user

    if (!user || !user._id) {
        return res.status(401).json({ message: 'Unauthorized: user not found' })
    }
    // Resolve a valid ObjectId for the user (handles dev mode)
    let userId = mongoose.isValidObjectId(user._id) ? user._id : null
    if (!userId) {
        const anyUser = await userModel.findOne({}, {_id:1}).lean()
        if (anyUser && anyUser._id) userId = anyUser._id
    }
    if (!userId) return res.status(200).json({ rides: [] })

    const rides = await RideModel.find({
        status: requirement,
        User: userId,
      }).sort({ createdAt: -1 }).limit(5);

    return res.status(200).json({
        message:"Rides found Successfully",
        rides: rides || []
    })
    

})
// Rides can be fetched like cancelled rides completed rides

export const cancelRide = asyncHandler(async (req, res) => {
    const validationErr = validationResult(req);
    if (!validationErr.isEmpty()) {
        return res.status(400).json({ error: validationErr.array() });
    }

    const { rideId } = req.body;
    if (!rideId) {
        throw new Error("Ride ID is required");
    }

    const ride = await RideModel.findById(rideId).populate('Captain');
    if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
    }
    const {pickup}=ride

    const getPickup=await getLatLng(pickup)

    const nearbyCaptains=await getNearbyCaptains(getPickup.latitude,getPickup.longitude,2)
    // console.log(nearbyCaptains)
    
    const { status } = ride;
    if (status === 'pending') {
        await RideModel.findByIdAndUpdate({_id:rideId},{
            status:"cancelled"
          });
         nearbyCaptains.forEach(captain => {
            sendMessage(captain.socketId, {
                event: "ride-cancel-nearby",
                data: ride,
            });
        });
          return res.status(200).
          json({ message: "Pending ride cancelled successfully" });
    }

    if (status === 'accepted') {
        const {fare}=ride
        const fineAmount=calcFine(fare)
        sendMessage(ride.Captain.socketId, {
            event: "accept-ride-cancel",
            data: ride,
          });    
          return res.status(200).json({
            message: "Accepted ride cancelled with a fine",
            fine: fineAmount,
        });    
    }

    return res.status(400).
    json({ message: "Ride cannot be cancelled at this stage" });
});


export const createDelivery=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
        return res.status(400).json({
            error:validationErr.array()
        })
    }
    const {
        pickUp,
        drop,
        vehicleType
    }=req.body
    const user=req.user
    if(!pickUp || !drop || !vehicleType){
        throw new Error('Provide all information')
    }
  
    const fareDetails = await DeliveryModel(pickUp, drop);
    const { fares } = fareDetails; // Ensure fares is used (not fare directly)
    const{ distanceInKm}=fareDetails 
    const {durationInMins}=fareDetails
    const otp=generateOtp(6)
  
  
  
    //FIrst getting the latitudes and longitudes from pickup 
    const getPickup=await getLatLng(pickUp)
   
    const nearbyCaptains=await getNearbyCaptains(getPickup.latitude,getPickup.longitude,2)

    const newRide = await DeliveryModel.create({
        User: req.user._id,
        pickup: pickUp,
        destination: drop,
        vehicleType,
        duration:durationInMins,
        distance:distanceInKm,
        otp:otp,
        fees: fares[vehicleType], // Note: Use `fares` instead of `fare` here
    });
    const newRidewithUser=await RideModel.findOne({_id:newRide._id}).populate('User')
    newRide.otp=""
    nearbyCaptains.map(captain=>
        sendMessage(captain.socketId,{
            event:'new-delivery',
            data:newRidewithUser
        })   
    )
    return res.status(200).json(
        {
            message:"Delivery Created",
            newRidewithUser,
            nearbyCaptains
        }
    )


})


export const startDelivery=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
        return res.status(400)
        .json({
            error:validationErr.array()
        })
    }
    const {deliveryId,otp}=req.body


    if(!deliveryId || !otp){
        res.status(404).
        json({
            message:'Body Data missing'
        })
    }

    const delivery=await DeliveryModel.findOne({_id:rideId}).populate('User').populate('Captain')

    if(!delivery){
        throw new Error("Ride not found")
    }
    if(!delivery.otp===otp){
        throw new Error("Error Otp invalid")
    }

    await DeliveryModel.findByIdAndUpdate({_id:rideId},{
        status:'ongoing'
    })

      const user=delivery.User
      sendMessage(user.socketId,{
        event:'start-delivery',
        data:ride
      })

      return res.status(200)
      .json({
        message:"Delivery Accepted and started",
        delivery
      })
})

export const endDelivery=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
        res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {deliveryId}=req.body

    if(!deliveryId){
        res.status(404).
        json({
            message:'Delivery id missing'
        })
    }
    const delivery=await DeliveryModel.findOne({_id:deliveryId}).populate('User').populate('Captain')
    if(!delivery){
        res.status(400)
        .json({
            message:"Delivery Id not found"
        })
    }

    if(delivery.status!=='ongoing'){
    throw new Error('Ride not ongoing')
    }

    await DeliveryModel.findByIdAndUpdate({_id:rideId},{
        status:'completed'
    })

    const user=delivery.User
    sendMessage(delivey.User.socketId,{
        event:'payment',
        data:ride
    })   

    return res.status(200).json({
        ride,
        message:"Delivery Completed"
    })

})
// export const makeDeliveryPayment=asyncHandler(async (req,res) => {
//     const validationErr=validationResult(req)

//     if(!validationErr.isEmpty()){
//     return res.status(400).
//         json({
//             error:validationErr.array()
//         })
//     }
//     const {rideId,fare,paymentType,rating}=req.body

//     if(!rideId || !fare || !paymentType || !rating){
//     return res.status(404).
//         json({
//             message:'Ride id missing or fare missing'
//         })
//     }
//     const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
//     if(!ride){
//     return    res.status(400)
//         .json({
//             message:"Ride Id not found"
//         })
//     }
//     const captain=ride.Captain
//     await CaptainModel.findByIdAndUpdate({
//         _id:captain._id
//     },
//     {rating:rating}
//     )
//     if(ride.status!=='completed'){
//     throw new Error('Ride not completed')
//     }

//     if(ride.fare===fare)
//     await RideModel.findByIdAndUpdate({_id:rideId},{
//         status:'completed',
//         paymentType:paymentType
//     })

//     return res.status(200).json({
//         ride,
//         message:"Delivery Completed and payment done"
//     })

// })


export const getNearbyPolice=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
    return res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId,latitude,longitude,reason}=req.body

    if(!rideId  || !longitude || !latitude || !reason){
    return res.status(404).
        json({
            message:'Ride id missing or Location missing missing'
        })
    }
    console.log(rideId,latitude,longitude,reason);
    const ride=await RideModel.findById({_id:rideId})
    if(!ride){
        return res.status(400)
        .json({
            message:"Ride Not Found"
        })
    }
    if(ride.status!=="ongoing"){
        return res.status(400)
        .json({
            message:"Ride Is not started"
        }) 
    }
    await RideModel.findByIdAndUpdate({_id:rideId},{
        policeAlert:{
            reason:reason,
            callMade:true
        }
    })
    const key=process.env.GOMAPS_API_KEY
    const response=await axios.get(`https://maps.gomaps.pro/maps/api/place/nearbysearch/json`,
    {
      params: {
        keyword: "police",
        location: `${latitude},${longitude}`,
        radius: 15, // 1500 meters (Google Maps uses meters, not just '15')
        key: key,
      },
    }
  );        const data=response.data.results
        // console.log(data);
        const nearbyPoliceStation=data[0]
        // console.log(nearbyPoliceStation);
        if(data.length===0){
            return res.status(404).
            json({
                message:"Sorry No nearby Police station"
            })
        }

        sendMessage(ride.Captain.socketId,{
            event:"police-alert",
            data:nearbyPoliceStation
        })
        return res.status(200)
        .json({
            Reason:`${reason} has been duely noted`,
            Message:`${nearbyPoliceStation.name} Has been notified`
        })


})