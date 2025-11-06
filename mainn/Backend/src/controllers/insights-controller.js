import { asyncHandler } from "../utils/Asynchandler.js"
import { RideModel } from "../models/ride-schema.js"
import { getSuggestion } from "../utils/MapServices.js"
import axios from 'axios'

// naive in-memory cache for geocoding results to reduce calls
const geoCache = new Map()

function toRad(d){ return d*Math.PI/180 }
function haversine(a,b){
  const R=6371
  const dLat=toRad(b.lat-a.lat)
  const dLng=toRad(b.lng-a.lng)
  const s1=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2
  return 2*R*Math.atan2(Math.sqrt(s1), Math.sqrt(1-s1))
}

export const getHotspots = asyncHandler(async (req,res)=>{
  const { lat:latStr, lng:lngStr, limit:limitStr } = req.query
  const lat = Number(latStr)
  const lng = Number(lngStr)
  const limit = Math.min(10, Math.max(1, Number(limitStr)||5))

  // fetch recent rides (last 24h or last 200)
  const since = new Date(Date.now()-24*60*60*1000)
  const recent = await RideModel.find({ createdAt: { $gte: since } }, { pickup:1, createdAt:1 }).sort({ createdAt:-1 }).limit(200).lean()

  const bucket = new Map()
  for(const r of recent){
    const key = (r.pickup||'').trim().toLowerCase()
    if(!key) continue
    bucket.set(key, (bucket.get(key)||0)+1)
  }

  const entries = Array.from(bucket.entries()).sort((a,b)=>b[1]-a[1]).slice(0,40)

  async function geocode(name){
    if(geoCache.has(name)) return geoCache.get(name)
    try{
      const sugg = await getSuggestion(name, null, null, 1, true)
      if(Array.isArray(sugg) && sugg.length){
        const obj = { display: sugg[0].display_name || name, lat: parseFloat(sugg[0].lat), lng: parseFloat(sugg[0].lng) }
        geoCache.set(name, obj)
        return obj
      }
    }catch{}
    const obj = { display: name, lat: undefined, lng: undefined }
    geoCache.set(name, obj)
    return obj
  }

  const results = []
  for(const [name, count] of entries){
    const g = await geocode(name)
    let distanceKm
    if(Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(g.lat) && Number.isFinite(g.lng)){
      distanceKm = haversine({lat,lng},{lat:g.lat,lng:g.lng})
    }
    const score = (count) * (distanceKm!=null ? (1/(1+distanceKm)) : 1)
    results.push({ label: g.display, lat: g.lat, lng: g.lng, count, distanceKm, score })
  }
 
  results.sort((a,b)=> (b.score - a.score))
  return res.status(200).json({ hotspots: results.slice(0, limit) })
})

// Build time series (5-min buckets) of pickups matching a label in the last N hours
async function seriesForLabel(label, hours=24){
  const since = new Date(Date.now() - hours*60*60*1000)
  const rides = await RideModel.find({ createdAt: { $gte: since }, pickup: { $regex: label, $options: 'i' } }, { createdAt:1 }).sort({ createdAt: 1 }).lean()
  const bucketMs = 5*60*1000
  const start = new Date(Math.floor(since.getTime()/bucketMs)*bucketMs)
  const now = new Date()
  const buckets = []
  for(let t=start.getTime(); t<=now.getTime(); t+=bucketMs){ buckets.push({ t, c:0 }) }
  let idx = 0
  for(const r of rides){
    while(idx < buckets.length-1 && r.createdAt.getTime() > buckets[idx].t + bucketMs){ idx++ }
    if(idx < buckets.length){ buckets[idx].c += 1 }
  }
  return buckets.map(b => ({ ts: new Date(b.t).toISOString(), y: b.c }))
}

export const getForecast = asyncHandler(async (req,res)=>{
  const { lat:latStr, lng:lngStr, limit:limitStr, horizonMin:hzStr } = req.query
  const lat = Number(latStr), lng = Number(lngStr)
  const limit = Math.min(5, Math.max(1, Number(limitStr)||3))
  const horizonMin = Math.min(60, Math.max(5, Number(hzStr)||30))

  // Reuse hotspots as targets to forecast
  const hsResp = await getHotspots({ query: { lat, lng, limit } }, { status: ()=>({ json: (v)=>v }) })
  const hotspots = (hsResp && hsResp.hotspots) ? hsResp.hotspots : []

  const url = process.env.ML_FORECAST_URL || 'http://localhost:8000/forecast'
  const results = []
  for(const h of hotspots){
    const series = await seriesForLabel(h.label, 24)
    let forecast = []
    let source = 'heuristic'
    try{
      const resp = await axios.post(url, { series, horizon: Math.ceil(horizonMin/5) })
      if (Array.isArray(resp?.data?.forecast)) {
        forecast = resp.data.forecast
        source = 'ml'
      } else {
        throw new Error('Malformed ML response')
      }
    }catch(e){
      // Fallback: simple moving average
      const ys = series.map(p=>p.y)
      const w = 6
      const avg = ys.length ? ys.slice(-w).reduce((a,b)=>a+b,0)/Math.min(w, ys.length) : 0
      forecast = Array.from({length: Math.ceil(horizonMin/5)}, ()=> Math.max(0, Math.round(avg)))
      source = 'heuristic'
    }
    results.push({ ...h, forecast, source, bucketMinutes: 5 })
  }
  return res.status(200).json({ forecasts: results })
})
