import { CaptainModel } from "../models/captain-model.js";
import { RideModel } from "../models/ride-schema.js";
import { getDistanceandTime, getLatLng } from "./MapServices.js";
import crypto from 'crypto'



export async function calcFare(origin,destination) {

    
    if(!origin  || !destination){
        throw new Error('Origin or destination missing')
    }
    const fareDetails = {
        car: { baseFare: 50, ratePerKm: 15 },
        auto: { baseFare: 30, ratePerKm: 10 },
        motorcycle: { baseFare: 20, ratePerKm: 8 }
    };

    let distanceInKm = 0;
    let durationInMins = 0;
    const distanceTime=await getDistanceandTime(origin,destination)
    if (distanceTime && typeof distanceTime.distance === 'number' && typeof distanceTime.duration === 'number' && distanceTime.distance > 0) {
        // OSRM returns meters and seconds
        distanceInKm = distanceTime.distance / 1000; 
        durationInMins = Math.round(distanceTime.duration / 60);
    } else {
        // Fallback: straight-line distance using geocoded coordinates
        const a = await getLatLng(origin)
        const b = await getLatLng(destination)
        if (!a || !b) {
            throw new Error('Failed to geocode addresses for distance calculation');
        }
        const toRad = (x) => x * Math.PI / 180
        const R = 6371; // km
        const dLat = toRad(b.latitude - a.latitude)
        const dLon = toRad(b.longitude - a.longitude)
        const lat1 = toRad(a.latitude)
        const lat2 = toRad(b.latitude)
        const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
        const d = 2 * R * Math.asin(Math.sqrt(h)) // km
        distanceInKm = Math.max(0, d)
        // assume average 30 km/h if OSRM unavailable
        const avgSpeedKmh = 30
        durationInMins = Math.max(1, Math.round((distanceInKm / avgSpeedKmh) * 60))
    }
        
    const fares={}

   for (const vehicleDetails in fareDetails) {
   const {baseFare,ratePerKm}=fareDetails[vehicleDetails]
   fares[vehicleDetails]=Math.round(baseFare+(ratePerKm*distanceInKm))
   }

   return { fares, distanceInKm, durationInMins };
}

export function generateOtp(num){
    //The num is the length of otp
    const otp = crypto.randomInt(0, Math.pow(10, num)).toString().padStart(num, '0');
    return otp;
}


export const getNearbyCaptains=async function(lat,lng,radius){
    if(typeof lat !== 'number' || typeof lng !== 'number'){
        throw new Error('Parameters missing')
    }
    const caps = await CaptainModel.find({
        socketId: { $exists: true, $ne: null },
        status: 'active'
    }).lean()

    const toRad = (d)=> d * Math.PI / 180
    const haversine = (a, b)=>{
        const R=6371
        const dLat = toRad((b.lat - a.lat))
        const dLng = toRad((b.lng - a.lng))
        const s1 = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2
        const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1-s1))
        return R*c
    }

    const origin = { lat, lng }
    let list = caps.map(c => {
        const hasLoc = c?.location && typeof c.location.lat === 'number' && typeof c.location.lng === 'number'
        const distanceKm = hasLoc ? haversine(origin, { lat: c.location.lat, lng: c.location.lng }) : null
        return { ...c, distanceKm }
    })

    if (Number.isFinite(radius)) {
        list = list.filter(c => c.distanceKm <= radius)
    }
    list = list.sort((a,b)=> {
        if (a.distanceKm==null && b.distanceKm==null) return 0
        if (a.distanceKm==null) return 1
        if (b.distanceKm==null) return -1
        return a.distanceKm - b.distanceKm
    })
    return list
}

export const calcFine=(fare)=>{
    const fine = Math.round(fare * 0.1); // 10% of the fare
    return fine;
}

export async function calcdeliveryFees(origin,destination) {

    
    if(!origin  || !destination){
        throw new Error('Origin or destination missing')
    }
    const fareDetails = {
        car: { baseFare: 50, ratePerKm: 10},
        auto: { baseFare: 30, ratePerKm: 8 },
        motorcycle: { baseFare: 20, ratePerKm: 6 }
    };

    const distanceTime=await getDistanceandTime(origin,destination)
    
    if (!distanceTime || !distanceTime.rows || !distanceTime.rows[0].elements[0].distance) {
        throw new Error('Failed to retrieve distance and time');
    }

    // Extract distance and duration
    const distanceInKm = distanceTime.rows[0].elements[0].distance.value / 1000; // Convert meters to kilometers
    const durationInMins = Math.round(distanceTime.rows[0].elements[0].duration.value / 60);; // Convert seconds to minutes
        
    const fares={}

   for (const vehicleDetails in fareDetails) {
   const {baseFare,ratePerKm}=fareDetails[vehicleDetails]
   fares[vehicleDetails]=Math.round(baseFare+(ratePerKm*distanceInKm))
   }

   return { fares, distanceInKm, durationInMins };
}