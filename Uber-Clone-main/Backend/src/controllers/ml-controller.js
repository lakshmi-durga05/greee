import axios from 'axios'
import { asyncHandler } from '../utils/Asynchandler.js'

function clamp01(x){ return Math.max(0, Math.min(1, x)) }

export const acceptPredict = asyncHandler(async (req, res) => {
  const {
    pickup,
    destination,
    distanceKm,
    durationMin,
    fare,
    vehicleType,
    hourOfDay,
    userRating,
    captainRating
  } = req.body || {}

  const payload = {
    pickup: pickup || '',
    destination: destination || '',
    distanceKm: Number(distanceKm) || 0,
    durationMin: Number(durationMin) || 0,
    fare: Number(fare) || 0,
    vehicleType: vehicleType || 'Auto',
    hourOfDay: Number.isFinite(Number(hourOfDay)) ? Number(hourOfDay) : new Date().getHours(),
    userRating: Number(userRating) || 4.5,
    captainRating: Number(captainRating) || 4.5,
    horizon: 6 // 6 x 5min = 30min series for graph
  }

  const url = process.env.PREDICT_URL || 'http://localhost:8002/predict'
  let prob = 0.5
  let series = []
  let source = 'heuristic'
  try{
    const resp = await axios.post(url, payload, { timeout: 1500 })
    if (resp?.data && typeof resp.data.probAccept === 'number') {
      prob = clamp01(resp.data.probAccept)
      series = Array.isArray(resp.data.series) ? resp.data.series.map(clamp01) : []
      source = 'ml'
    } else {
      throw new Error('Malformed ML response')
    }
  }catch(e){
    // Heuristic fallback based on short trips and ratings
    const base = 0.6
    const shortTripBoost = payload.distanceKm < 5 ? 0.15 : 0
    const rushHourPenalty = (payload.hourOfDay>=18 && payload.hourOfDay<=21) ? -0.08 : 0
    const ratingAdj = ((payload.captainRating-4.5) + (payload.userRating-4.5)) * 0.05
    prob = clamp01(base + shortTripBoost + rushHourPenalty + ratingAdj)
    // Simple decaying series around prob
    series = Array.from({length: payload.horizon}, (_,i)=> clamp01(prob - 0.02*i))
    source = 'heuristic'
  }

  return res.status(200).json({ probAccept: prob, series, bucketMinutes: 5, source, features: payload })
})
