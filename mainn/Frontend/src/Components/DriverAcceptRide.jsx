import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Clock, DollarSign, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { SocketContext } from "../Context/SocketContext"
import { useContext } from "react"

function ConfirmationPopup({ ride, isVisible, onClose }) {
  const [otp, setOtp] = useState("")
  const [startErr, setStartErr] = useState("")
  const [isRideCancelled, setIsRideCancelled] = useState(false) // Track ride cancellation
  const nav = useNavigate()
  const token = localStorage.getItem("captoken")
  const { socket } = useContext(SocketContext)

  const goToRiding = async () => {
    try {
      setStartErr("")
      if (!/^\d{6}$/.test(otp)) {
        setStartErr("Enter the 6-digit OTP shared by the passenger")
        return
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/ride/start`,
        {
          rideId: ride._id,
          otp: otp,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (response.status === 200) {
        const ride = response.data.ride
        const user = ride.User
        nav("/captainRideStarted", {
          state: {
            ride,
            user,
          },
        })
      }
    } catch (err) {
      console.log(err)
      const api = err?.response?.data
      setStartErr(api?.message || "Failed to start ride. Check OTP and try again.")
    }
  }

  useEffect(() => {
    const handleRideCancel = (data) => {
      console.log("Ride cancelled:", data)
      setIsRideCancelled(true)  // Mark the ride as cancelled
      onClose()  // Close the popup
    }

    socket.on("accept-ride-cancel", handleRideCancel)

    // Cleanup the event listener when the component unmounts or when `socket` changes
    return () => {
      socket.off("accept-ride-cancel", handleRideCancel)
    }
  }, [socket, onClose])  // Ensure onClose is in the dependency array

  return (
    <AnimatePresence mode="wait">
      {isVisible && !isRideCancelled && (  // Check for ride cancellation before showing the popup
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 sm:px-0"
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative"
            initial={{ y: "50%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close popup"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Ride Accepted</h2>
            <div className="space-y-2 sm:space-y-4 text-gray-700">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                <span>Pickup: {ride.pickup}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
                <span>Dropoff: {ride.dropoff}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" />
                <span>Est. Time: {ride.estimatedTime} mins</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                <span>Fare: ₹{ride.fare}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" />
                <span>Passenger: {ride.passengerName}</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              {ride?.otp && (
                <div className="mb-3 text-sm text-gray-700">
                  <span className="font-medium">Passenger OTP:</span> {ride.otp}
                </div>
              )}
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="Enter 6-digit OTP from passenger"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              {startErr && <p className="mt-2 text-sm text-red-600">{startErr}</p>}
              <button
                onClick={goToRiding}
                className="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm sm:text-base disabled:opacity-50"
                disabled={!/^\d{6}$/.test(otp)}
              >
                Start Ride
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DriverAcceptRide({ rideData }) {
  const [isRidePopupVisible, setIsRidePopupVisible] = useState(false)
  const [isConfirmationPopupVisible, setIsConfirmationPopupVisible] = useState(false)
  const [acceptedRide, setAcceptedRide] = useState(null)
  const { socket } = useContext(SocketContext)
  const closeRidePopup = () => setIsRidePopupVisible(false)
  const [isRideCancelled, setIsRideCancelled] = useState(false)

  useEffect(() => {
    if (rideData && Object.keys(rideData).length > 0) {
      setIsRidePopupVisible(true)
    }
  }, [rideData])

  const handleAccept = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/ride/accept`,
        { rideId: rideData._id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("captoken")}` },
        },
      )
      if (response.status === 200) {
        console.log("Ride Accepted:", response.data)
        // Use server-returned ride (includes OTP and populated entities)
        setAcceptedRide(response.data.ride)
        setIsRidePopupVisible(false)
        setIsConfirmationPopupVisible(true)
      }
    } catch (error) {
      console.error("Error accepting ride:", error)
    }

    setIsRidePopupVisible(false)
    setIsConfirmationPopupVisible(true)
  }
  useEffect(() => {
    const handleRideCancel = (data) => {
      console.log("Ride cancelled:", data)
      setIsRideCancelled(true)
      setIsRidePopupVisible(false)
      setIsConfirmationPopupVisible(false)
    }

    socket.on("ride-cancel-nearby", handleRideCancel)

    // Cleanup the event listener when the component unmounts or when `socket` changes
    return () => {
      socket.off("ride-cancel-nearby", handleRideCancel)
    }
  }, [socket])

  const handleIgnore = () => {
    console.log("Ride Ignored!")
    setIsRidePopupVisible(false)
  }

  const handleCloseConfirmation = () => {
    setIsConfirmationPopupVisible(false)
  }

  if (!rideData || Object.keys(rideData).length === 0) return null // Don't render if no ride data.
  // console.log(rideData.User)
  const ride = rideData
  const user = rideData.User

  return (
    <div>
      <AnimatePresence mode="wait">
        {isRidePopupVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 sm:px-0"
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative"
              initial={{ y: "50%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "50%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
            >
              <button
                onClick={closeRidePopup}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">New Ride Request</h2>
              <div className="space-y-2 sm:space-y-4 text-gray-700">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                  <span>Pickup: {ride.pickup}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
                  <span>Destination: {ride.destination}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" />
                  <span>Duration: {ride.duration} mins</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                  <span>Fare: ₹{ride.fare}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500" />
                  <span>
                    Passenger: {user.fullname.firstname} {user.fullname.lastname}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 space-y-2 sm:space-y-0">
                <button
                  onClick={handleIgnore}
                  className="w-full sm:w-[48%] bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Ignore
                </button>
                <button
                  onClick={handleAccept}
                  className="w-full sm:w-[48%] bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationPopup ride={acceptedRide || ride} isVisible={isConfirmationPopupVisible} onClose={handleCloseConfirmation} />
    </div>
  )
}
export default DriverAcceptRide

