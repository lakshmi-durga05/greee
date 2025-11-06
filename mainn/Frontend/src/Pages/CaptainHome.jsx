import React,{useEffect, useState, useRef} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, User, CheckCircle } from 'lucide-react';
import { DriverAcceptRide, Header } from '../Components';
import { useContext } from 'react';
import { CaptainContext, CaptainDataContext } from '../Context/CaptainContext';
import { SocketContext } from '../Context/SocketContext';
import { connectLiveWS } from '../utils/liveWS';
function CaptainHome() {
   
    const [rides, setRides] = useState({});
    const [acceptedRides,setAcceptedRides]=useState([])
    const [recentRequests,setRecentRequests]=useState([])
    const [location,setLocation]=useState()
    const [hotspots,setHotspots]=useState([])
    const [forecasts,setForecasts]=useState([])
    const {captain}=useContext(CaptainDataContext)
    const {socket}=useContext(SocketContext)
    const navigate = useNavigate()
    const liveWsRef = useRef(null)

useEffect(()=>{
  if(!captain || !socket) return
  socket.emit('join',{userId:captain._id,role:"captain"})
  // Connect live WS for streaming location to users tracking
  const live = connectLiveWS()
  live.join(captain._id, 'driver')
  liveWsRef.current = live

  const sendLocation=function(){
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition((location)=>{
        const coords = {lat:location.coords.latitude,lng:location.coords.longitude}
        setLocation(coords)
        socket.emit('update-location',{location:coords,id:captain._id})
        try{ live.sendLocation(captain._id, coords) }catch{}
      })
    }
  }
  const interval=setInterval(sendLocation,5000)
  sendLocation()
  return ()=>{
    clearInterval(interval)
    try{ liveWsRef.current?.ws?.close() }catch{}
  }
},[captain, socket])

useEffect(()=>{
  if(!socket) return
  const handler=(data)=>{
    console.log('incoming new-ride', data)
    setRides(data)
    setRecentRequests(prev=>[data, ...prev].slice(0,5))
  }
  socket.on('new-ride', handler)
  return ()=>{
    socket.off('new-ride', handler)
  }
},[socket, captain?.vehicle?.vehicleType])

// Fetch predictive hotspots when we have a location
useEffect(()=>{
  const fetchHotspots=async()=>{
    try{
      if(!location) return
      const url = `${import.meta.env.VITE_BASE_URL}/insights/hotspots?lat=${location.lat}&lng=${location.lng}&limit=3`
      const res = await axios.get(url)
      const hs = Array.isArray(res?.data?.hotspots) ? res.data.hotspots : []
      setHotspots(hs)
    }catch(e){ setHotspots([]) }
  }
  fetchHotspots()
},[location])

// Fetch LSTM forecasts (falls back to MA on backend if ML disabled)
useEffect(()=>{
  const fetchForecasts=async()=>{
    try{
      if(!location) return
      const url = `${import.meta.env.VITE_BASE_URL}/insights/forecast?lat=${location.lat}&lng=${location.lng}&limit=3&horizonMin=30`
      const res = await axios.get(url)
      const fs = Array.isArray(res?.data?.forecasts) ? res.data.forecasts : []
      setForecasts(fs)
    }catch(e){ setForecasts([]) }
  }
  fetchForecasts()
},[location])

const handleLogout = () => {
  console.log("Logging out...")
  try { localStorage.removeItem('captoken') } catch {}
  navigate('/login')
}

    return (
        <>
       <Header />
       <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
        <div className="font-semibold">
          Welcome, {captain?.fullname?.firstname || 'Captain'} {captain?.vehicle?.vehicleType ? `(${captain.vehicle.vehicleType})` : ''}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      {rides && rides._id && <DriverAcceptRide rideData={rides} />}
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Available Ride Requests</h1>
        {(hotspots.length>0 || forecasts.length>0) && (
          <div className="mb-6 p-4 border rounded bg-white">
            <div className="font-semibold mb-2">Suggested Zones (with 30‑min forecast)</div>
            <div className="space-y-3">
              {(forecasts.length>0 ? forecasts : hotspots).map((h,i)=>{
                const total = Array.isArray(h.forecast) ? h.forecast.reduce((a,b)=>a+(Number(b)||0),0) : undefined
                return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{h.label}</div>
                    {h.distanceKm!=null && <div className="text-gray-500">~{Number(h.distanceKm).toFixed(1)} km away</div>}
                    {total!=null && (
                      <div className="text-gray-700 flex items-center gap-2">
                        <span>Forecast (30 min): {total}</span>
                        {h.source && (
                          <span className={`px-2 py-0.5 rounded text-xs ${h.source==='ml' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{h.source==='ml' ? 'ML' : 'Heuristic'}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {h.lat!=null && h.lng!=null && (
                    <a className="text-blue-600 hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}>Navigate</a>
                  )}
                </div>)
              })}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {recentRequests.map((r,i)=> (
            <div key={r._id || i} className="border rounded p-3 bg-white">
              <div className="text-sm text-gray-600">{r.pickup} → {r.destination}</div>
              <div className="text-xs text-gray-500">Fare: ₹{r.fare} • Duration: {r.duration} mins</div>
            </div>
          ))}
          {recentRequests.length===0 && (
            <div className="text-sm text-gray-500">No requests yet. Keep this page open to receive new ride requests.</div>
          )}
        </div>
      </div>
      </>
    )
}

export default CaptainHome
