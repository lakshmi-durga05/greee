import { asyncHandler } from "../utils/Asynchandler.js";
import axios from 'axios'
import { validationResult } from "express-validator";
// import { getRoute } from "../utils/getDistance.js";
import { getDistanceandTime,getLatLng,getSuggestion, getAddressFromLatLng } from "../utils/MapServices.js";

export const getCoordinates=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
        return res.status(400)
        .json({
            error:validationErr.array()
        })
    }
    

    const {address}=req.query
    if(!address){
        throw new Error("Provide address")
    }
    const response=await getLatLng(address)
    if(response===null){
        return res.status(400)
        .json({
            message:"Address not found"
        })
    }
    const{latitude,longitude}=response
    
    
    return res.status(200)
    .json({
        longitude,
        latitude
    })


})


export const getDistance=async (req,res) => {
   try {
     const {origin,destination}=req.body
//  console.log(origin);
     if(!origin || !destination){
         throw new Error('Please provide both location')
     }
     const response=await getDistanceandTime(origin,destination)
     return res.status(200)
     .json({
      Distance:response
     })
 
   } catch (error) {
    console.log(error);
   }

}
export const  getSuggestions=asyncHandler(async (req,res) => {
  const {input, lat, lng, limit, fast}=req.query
  const validationErr=validationResult(req)
  if(!validationErr.isEmpty()){
    return res.status(400).
    json({
        error:validationErr.array()
    })
  }
  if(!input){
    throw new Error('Provide address to get Suggestions')
  }

  const suggestions=await getSuggestion(input, lat, lng, limit, fast === '1' || fast === 'true')
  return res.status(200)
  .json({
    suggestions
  })

})

export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query
  const validationErr = validationResult(req)
  if (!validationErr.isEmpty()) {
    return res.status(400).json({ error: validationErr.array() })
  }
  if (!lat || !lng) {
    throw new Error('Provide lat and lng')
  }
  const result = await getAddressFromLatLng(lat, lng)
  if (!result) {
    return res.status(404).json({ message: 'Address not found' })
  }
  // keep backward compatibility: address string, plus meta
  return res.status(200).json({ address: result.address, countryCode: result.countryCode, city: result.city })
})