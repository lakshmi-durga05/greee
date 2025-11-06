import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { SocketContext } from '../Context/SocketContext';
import VehicleDetails from './VehicleDetails';

const WaitingScreen = ({ vehicle, onBack }) => {
  const { socket } = useContext(SocketContext);
  const [acceptedRideDetails, setAcceptedRideDetails] = useState(null); // State to hold ride details
  const [isCancelling, setIsCancelling] = useState(false); // State to track cancel request
  const [rideDetails,setRideDetails]=useState('')
  const cancelRide = async () => {
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/ride/cancelRide`,
        { rideId: rideDetails._id }, // Pass the ride/vehicle ID or necessary payload
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        console.log('Ride cancelled successfully');
        onBack(); // Navigate back or handle cancellation logic
      }
    } catch (error) {
      console.error('Failed to cancel ride:', error);
    } finally {
      setIsCancelling(false);
    }
  };
  useEffect(() => {
    const createRide = async () => {
      try {
        const token = localStorage.getItem('usertoken');
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/ride/create`,
          {
            pickUp: vehicle.pickup,
            drop: vehicle.drop,
            vehicleType: vehicle.name.toLowerCase(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          console.log('Ride is created and waiting for captain');
          setRideDetails(response.data.newRidewithUser)
          console.log(rideDetails);
        }
      } catch (error) {
        console.log(error);
        onBack(); // Handle errors gracefully
      }
    };

    createRide();
    console.log(rideDetails)
    
  }, [vehicle, onBack, socket]);

useEffect(() => {
  // Set up socket event listener
  socket.on('accept-ride', (data) => {
    console.log('Driver accepted', data);
    setAcceptedRideDetails(data); // Set the ride details to trigger VehicleDetails rendering
  });
  console.log(rideDetails)

  return () => {
    socket.off('accept-ride');
  };
}, [socket]);

  // Conditional rendering: show VehicleDetails if rideDetails is available
  if (acceptedRideDetails) {
    return <VehicleDetails vehicle={acceptedRideDetails} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-screen bg-gray-100"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="mb-8"
      >
        <Loader2 className="w-16 h-16 text-blue-500" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-4">Looking for your ride...</h2>
      <p className="text-gray-600 mb-2">
        We're finding the perfect {vehicle.name} for you.
      </p>
      <p className="text-gray-500 text-sm">This usually takes 1-3 minutes.</p>
      
      <button
        onClick={cancelRide}
        className={`px-6 py-2 text-white font-bold rounded-md ${
          isCancelling ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
        }`}
        disabled={isCancelling}
      >
        {isCancelling ? 'Cancelling...' : 'Cancel Ride'}
      </button>
    </motion.div>
  );
};

export default WaitingScreen;
