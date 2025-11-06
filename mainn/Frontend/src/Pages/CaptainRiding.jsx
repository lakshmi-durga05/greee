import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, User, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "../Components";
import { useLocation } from "react-router-dom";
import {LiveTracking} from "../Components";
// import { useNavigate } from "react-router-dom";
import axios from "axios";
function CaptainRidingPage(props) {
  const {state}=useLocation()
  const{ride,user}=state || {}
  const token=localStorage.getItem('captoken')
  console.log(ride)
  const [isComplete, setIsComplete] = useState(false);

  const navigate = useNavigate();

  
  const onCompleteRide = async () => {
    try {
     
     const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/ride/ended`,
        { rideId:ride._id }, // Body with rideId
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add token in headers
          },
        }
      );

      if (response.status === 200) {
      
        setIsComplete(true);
        navigate("/caphome"); 
      }
    } catch (error) {
      console.error("Error completing ride:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <Header />

       
        <LiveTracking />

        {/* Ride Info */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mx-4 -mt-20 bg-white rounded-lg shadow-lg"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">{ride.distance} Km</h2>
                <p className="text-gray-500">remaining</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{ride.duration} min</p>
                <p className="text-gray-500">arrival</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold">Passenger {user.fullname.firstname}</h3>
            <p className="text-gray-500">Destination: {ride.destination}</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
          className="bg-white p-4 shadow-lg mt-4"
        >
          <button
          onClick={onCompleteRide} 
          className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 flex items-center justify-center">
            <MapPin className="mr-2 h-5 w-5" />
            Complete Ride
          </button>
        </motion.footer>
      </div>
    </>
  );
}

export default CaptainRidingPage;
