import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Header, LiveTracking, UserPaymentPopup } from "../Components";
import { SocketContext } from "../Context/SocketContext";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function UserRideStarted() {
  const [fareDetails, setFareDetails] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSOSPopup, setShowSOSPopup] = useState(false);
  const nav = useNavigate();
  const { state } = useLocation();
  const { vehicle, captain } = state || {};
  const { socket } = useContext(SocketContext);
  
  useEffect(() => {
    if (!vehicle || !captain) {
      console.error("Vehicle or captain data is missing");
      return;
    }
    // console.log("Ride details",vehicle)
    socket.on("payment", () => {
      console.log("Payment event received");
      nav("/payment", {
        state: {
          vehicle,
          captain,
        },
      });
    });

    return () => {
      socket.off("payment");
    };
  }, [socket, nav, vehicle, captain]);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <LiveTracking driverId={captain?._id} />
        
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mx-4 -mt-20 bg-white rounded-lg shadow-lg"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">{vehicle?.duration} km</h2>
                <p className="text-gray-500">remaining</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{vehicle?.duration} min</p>
                <p className="text-gray-500">arrival</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold">Captain {captain?.fullname?.firstname}</h3>
            <div className="flex items-center mb-2">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="text-gray-600">4.8</span>
            </div>
            <p className="text-gray-500">Toyota Camry • {captain?.vehicle?.plate}</p>
          </div>
        </motion.div>

        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
          className="bg-white p-4 shadow-lg mt-4"
        >
          <button className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 flex items-center justify-center">
            <MapPin className="mr-2 h-5 w-5" />
            Share Trip Status
          </button>
          <button
            onClick={() =>nav('/sos',{
              state:vehicle._id
            })}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 flex items-center justify-center"
          >
            <AlertTriangle className="mr-2 h-5 w-5" />
            SOS
          </button>
        </motion.footer>
      </div>
    </>
  );
}

export default UserRideStarted;
