import React, { useCallback, useContext, useEffect,useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Users, Clock,MapPin } from 'lucide-react';
import axios from 'axios';
import { SocketContext, SocketProvider } from '../Context/SocketContext';

import { useNavigate } from 'react-router-dom';


function VehicleDetails({ vehicle, onBack }) {
  const token = localStorage.getItem('usertoken');
  const [isCancelling, setIsCancelling] = useState(false)
  const nav=useNavigate()
  const {socket}=useContext(SocketContext)
  const [rideId,setRideId]=useState(null)
  const [sending,setSending]=useState(false)
  const [banner,setBanner]=useState({ type:null, message:'' })
  const [ride,setRide]=useState(null)
  const [paymentType,setPaymentType]=useState('Cash')
  const [rating,setRating]=useState(5)
  const [predLoading,setPredLoading]=useState(false)
  const [pred,setPred]=useState(null) // { probAccept, series, source }
  const createRide = useCallback(async () => {
    try {
      setSending(true)
      setBanner({type:null,message:''})
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/ride/create`,
        {
          pickUp: vehicle.pickup,
          drop: vehicle.destination,
          vehicleType: (vehicle.vehicleType || '').toLowerCase(),
          captainId: captain?._id || vehicle?.captainId || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if(response.status===200){
        const rid = response?.data?.newRidewithUser?._id
        if(rid) setRideId(rid)
        setBanner({ type:'success', message:'Request has been sent to the driver' })
        try {
          const hasCap = !!localStorage.getItem('captoken')
          window.open(hasCap ? '/caphome' : '/capLogin', '_blank', 'noopener')
        } catch(_) {}
      }
    } catch (error) {
      console.error(error);
      setBanner({ type:'error', message:'Failed to create ride. Please try again.' })
    }
    finally{ setSending(false) }
  }, [token, vehicle.pickup, vehicle.destination, vehicle.vehicleType]);
// console.log(vehicle);
  //Cancel ride with fine
  const cancelRide = useCallback(async () => {
    const id = vehicle._id || rideId
    if (!id) {
      console.error("No ride ID available")
      return
    }

    setIsCancelling(true)
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/ride/cancelRide`,
        { rideId: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      console.log("Ride cancelled:", response.data)
       // Go back to the previous screen after cancelling
      nav('/home')
      } catch (error) {
      console.error("Error cancelling ride:", error)
    } finally {
      setIsCancelling(false)
    }
  }, [token, vehicle._id, onBack])

  const handleConfirm = () => {
    createRide();
  };
  const captain=vehicle.Captain
  
  const handlePredict = useCallback(async()=>{
    try{
      setPredLoading(true)
      setPred(null)
      const body = {
        pickup: vehicle.pickup,
        destination: vehicle.destination,
        distanceKm: Number(vehicle.distance||0),
        durationMin: Number(vehicle.duration||0),
        fare: Number(vehicle.fare||0),
        vehicleType: (vehicle.vehicleType||'Auto'),
        hourOfDay: new Date().getHours(),
        userRating: 4.6,
        captainRating: Number(captain?.rating||4.5)
      }
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/ml/acceptPredict`, body)
      setPred(res?.data || null)
    }catch(e){
      setPred({ error: 'Prediction failed' })
    }finally{
      setPredLoading(false)
    }
  },[vehicle, captain])

  useEffect(()=>{
    if(!socket) return
    const onAccept=(acceptedRide)=>{
      if(acceptedRide && acceptedRide._id){
        setRideId(acceptedRide._id)
        setRide(acceptedRide)
        setBanner({ type:'success', message:`Driver accepted. Share this OTP with captain: ${acceptedRide.otp}` })
      }
    }
    const onStart=()=>{
      nav('/rideStarted',{state :{
        vehicle,
        captain
      }})
    }
    const onPayment=(rideCompleted)=>{
      if(rideCompleted && rideCompleted._id){
        setRide(rideCompleted)
        setBanner({ type:'success', message:'Ride completed. Please proceed to payment.' })
      }
    }
    socket.on('accept-ride', onAccept)
    socket.on('start-ride', onStart)
    socket.on('payment', onPayment)

    return ()=>{
      socket.off('accept-ride', onAccept)
      socket.off('start-ride', onStart)
      socket.off('payment', onPayment)
    }
  },[socket,nav,vehicle,captain])
  return (
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 50 }}
  transition={{ duration: 0.3 }}
  className="bg-white min-h-screen flex flex-col"
>
  <div className="p-4 border-b">
    <button onClick={onBack} className="flex items-center text-gray-600" aria-label="Go back">
      <ChevronLeft className="w-6 h-6 mr-2" />
      <span className="text-lg font-semibold">Trip details</span>
    </button>
  </div>

  <div className="flex-1 overflow-y-auto">
    <div className="p-4 space-y-6">
      {banner.type && (
        <div className={`p-3 rounded ${banner.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {banner.message}
        </div>
      )}

      {/* Captain Details */}
      <div className="px-6 bg-gray-50 p-4 rounded-lg">
        <h3 className=" font-semibold mb-1">Your captain</h3>
        <div className="flex items-center space-x-3">
          <div>
            <p className="font-medium mt-1">{`${captain?.fullname?.firstname || 'N/A'} ${captain?.fullname?.lastname || ''}`}</p>
            <p className="mt-2 text-sm">
          <span className="font-semibold">PLATE:</span> {captain.vehicle?.plate || 'N/A'}
        </p>
          </div>
        </div>
        <p className="mt-2 text-sm">
          <span className="font-semibold">OTP:</span> {ride?.otp ? ride.otp : 'Waiting for driver to accept...'}
        </p>
      </div>

      {/* Pickup and Drop */}
      <div className="space-y-4">
        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Pickup</p>
            <p className="font-medium">{vehicle.pickup || 'Loading pickup location...'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Drop-off</p>
            <p className="font-medium">{vehicle.destination || 'Loading drop-off location...'}</p>
          </div>
        </div>
      </div>

      {/* Acceptance Prediction */}
      <div className="mt-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Will the ride be accepted?</h3>
          <button onClick={handlePredict} disabled={predLoading}
            className={`px-3 py-1.5 rounded text-white ${predLoading? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {predLoading ? 'Predicting...' : 'Predict'}
          </button>
        </div>
        {pred && !pred.error && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Acceptance Probability</div>
              <div className="flex-1 h-3 bg-gray-200 rounded">
                <div className="h-3 bg-green-500 rounded" style={{ width: `${Math.round((pred.probAccept||0)*100)}%` }} />
              </div>
              <div className="w-12 text-right text-sm font-medium">{Math.round((pred.probAccept||0)*100)}%</div>
            </div>
            {Array.isArray(pred.series) && pred.series.length>0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Next 30 min (5‑min buckets)</div>
                {(()=>{
                  const w=160,h=40,pad=2
                  const ys=pred.series.map(v=> Math.max(0, Math.min(1, Number(v)||0)))
                  const step = (w-2*pad)/Math.max(1, ys.length-1)
                  const points = ys.map((v,i)=>{
                    const x = pad + i*step
                    const y = pad + (1-v)*(h-2*pad)
                    return `${x},${y}`
                  }).join(' ')
                  return (
                    <svg width={w} height={h} className="bg-white">
                      <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points} />
                    </svg>
                  )
                })()}
              </div>
            )}
            {pred.source && (
              <div className="text-xs text-gray-500">Source: {pred.source==='ml' ? 'ML Model' : 'Heuristic'}</div>
            )}
          </div>
        )}
        {pred && pred.error && (
          <div className="text-sm text-red-600">{pred.error}</div>
        )}
        {!pred && !predLoading && (
          <div className="text-xs text-gray-500">Click Predict to see acceptance probability and a short forecast graph.</div>
        )}
      </div>

      {/* Trip Info */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          <span>{vehicle.duration || 'N/A'} min</span>
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-400" />
          <span>
            {vehicle.vehicleType === 'motorcycle' ? 'Up to 1 seat' : vehicle.vehicleType === 'auto' ? 'Up to 3 seats' : 'Up to 4 seats'}
          </span>
        </div>
      </div>

      {/* Fare Details */}
      <div>
        <h3 className="font-semibold mb-2">Fare breakdown</h3>
        <div className="space-y-2 text-sm">
          {(() => {
            const total = Number(vehicle.fare || 0)
            const distanceKm = Number(vehicle.distance || 0)
            const distanceCost = 50 // simple display like screenshot
            const base = Math.max(0, total - distanceCost)
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base fare</span>
                  <span>₹{base}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance ({distanceKm.toFixed(1)} km)</span>
                  <span>₹{distanceCost}</span>
                </div>
                <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>₹{base + distanceCost}</span>
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Payment Section - visible after ride completed (payment event) */}
      {ride?.status === 'completed' && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Payment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Fare</span><span>₹{ride.fare}</span></div>
            <div>
              <p className="font-medium mb-1">Payment Method</p>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1">
                  <input type="radio" name="pay" value="Cash" checked={paymentType==='Cash'} onChange={()=>setPaymentType('Cash')} />
                  <span>Cash</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input type="radio" name="pay" value="Online" checked={paymentType==='Online'} onChange={()=>setPaymentType('Online')} />
                  <span>Online</span>
                </label>
              </div>
            </div>
            <div>
              <p className="font-medium mb-1">Rate Captain</p>
              <select className="border rounded px-2 py-1" value={rating} onChange={e=>setRating(Number(e.target.value))}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </div>
            <button onClick={async()=>{
              try{
                if(!ride?._id) return
                await axios.post(`${import.meta.env.VITE_BASE_URL}/ride/makePayment`,{
                  rideId: ride._id,
                  fare: ride.fare,
                  paymentType: paymentType.toLowerCase(),
                  rating
                },{ headers:{ Authorization:`Bearer ${token}` }})
                setBanner({ type:'success', message:'Payment completed. Thank you!' })
                nav('/home')
              }catch(err){
                console.error(err)
                setBanner({ type:'error', message:'Payment failed. Please try again.' })
              }
            }} className="mt-3 w-full bg-black text-white py-3 rounded-lg">Confirm Payment</button>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Confirm Button */}
  {/* Confirm and Cancel Buttons */}
  <div className="p-4 border-t bg-white">
        <div className="flex space-x-4">
          <button
            className="flex-1 bg-red-500 text-white p-4 rounded-lg text-lg font-semibold disabled:opacity-50"
            onClick={cancelRide}
            disabled={isCancelling}
            aria-label="Cancel Ride"
          >
            {isCancelling ? "Cancelling..." : "Cancel Ride"}
          </button>
          <button
            className="flex-1 bg-black text-white p-4 rounded-lg text-lg font-semibold disabled:opacity-50"
            onClick={handleConfirm}
            disabled={sending}
            aria-label={`Confirm ${vehicle.name || "Ride"}`}
          >
            {sending ? 'Sending...' : `Confirm ${vehicle.name || 'Ride'}`}
          </button>
        </div>
      </div>
</motion.div>

  )}  
export default VehicleDetails;
