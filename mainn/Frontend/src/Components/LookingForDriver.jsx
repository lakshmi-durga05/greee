import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, ChevronLeft } from 'lucide-react';
import WaitingScreen from './WaitingScreen.jsx';
import VehicleDetails from './VehicleDetails.jsx';
import axios from 'axios';

function LookingForDriver({ onBack, pickup, drop }) {
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);
  const [bookingStage, setBookingStage] = useState('selection');
  const [fare, setFare] = useState({});
  const [distance, setDistance] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const getFares = async () => {
      const token = localStorage.getItem('usertoken');
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/ride/getFares`,
          { pickup, drop },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (response.status === 200) {
          setFare(response.data.fares);
          setEstimatedTime(response.data.estimatedTime);
          setDistance(response.data.distance);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getFares();
  }, [pickup, drop]);

  const handleConfirmVehicle = async (vehicleType, icon) => {
    const vehicleFare = fare[vehicleType.toLowerCase()];
    try {
      // geocode pickup to lat/lng
      const geo = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/getCo-ordinates`, {
        params: { address: pickup }
      })
      const lat = geo?.data?.latitude ?? geo?.data?.coordinates?.lat
      const lng = geo?.data?.longitude ?? geo?.data?.coordinates?.lng
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/captain/online`, {
        params: { vehicleType, lat, lng, radiusKm: 25 }
      })
      const online = Array.isArray(res?.data?.captains) ? res.data.captains : []
      const mapped = online.map(c => ({
        id: c._id,
        driver: c?.fullname?.firstname || 'Captain',
        plate: c?.vehicle?.plate || '',
        eta: c?.etaMin ?? 3,
        distanceKm: c?.distanceKm,
        type: vehicleType,
        fare: vehicleFare
      }))
      setOptions(mapped)
    } catch (e) {
      setOptions([])
    }
    setSelectedVehicleDetails({
      name: vehicleType,
      fare: vehicleFare,
      distance,
      estimatedTime,
      icon,
      pickup,
      drop
    });
    setBookingStage('choose-vehicle');
  };

  const chooseSpecificVehicle = (opt) => {
    // Assemble a provisional vehicle object for details screen
    const provisional = {
      name: selectedVehicleDetails?.name,
      vehicleType: selectedVehicleDetails?.name?.toLowerCase(),
      fare: selectedVehicleDetails?.fare,
      distance: Number(distance || 0).toFixed(1),
      duration: estimatedTime,
      pickup,
      destination: drop,
      captainId: opt?.id,
      Captain: {
        fullname: { firstname: opt.driver, lastname: '' },
        vehicle: { plate: opt.plate }
      }
    }
    setSelectedVehicleDetails(provisional)
    setBookingStage('details');
  }

  const handleBackToSelection = () => {
    setBookingStage('selection');
    setSelectedVehicleDetails(null);
  };

  if (bookingStage === 'waiting') {
    return (
      <WaitingScreen
        vehicle={selectedVehicleDetails}
        onBack={handleBackToSelection}
      />
    );
  }

  if (bookingStage === 'details') {
    return (
      <VehicleDetails
        vehicle={selectedVehicleDetails}
        onBack={handleBackToSelection}
      />
    )
  }

  if (bookingStage === 'choose-vehicle') {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <button className="mb-4 flex items-center text-gray-600" onClick={() => setBookingStage('selection')}>
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h1 className="text-xl font-bold mb-4">Choose a {selectedVehicleDetails?.name}</h1>
        <div className="grid grid-cols-1 gap-3">
          {options.map(opt => (
            <button key={opt.id} className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200" onClick={() => chooseSpecificVehicle(opt)}>
              <div>
                <div className="font-semibold">{opt.driver} • {opt.plate}</div>
                <div className="text-sm text-gray-600">ETA: {opt.eta} min</div>
                {opt.distanceKm!=null && (
                  <div className="text-xs text-gray-500">~{Number(opt.distanceKm).toFixed(1)} km away</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Distance: {Number(distance||0).toFixed(1)} Km</div>
                <div className="font-semibold">Fare: ₹{Math.round(opt.fare||0)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <button className="mb-4 flex items-center text-gray-600" onClick={onBack}>
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <h1 className="text-xl font-bold mb-4">Select Vehicle Type</h1>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 gap-4 mb-8"
      >
        <motion.button
          className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200"
          onClick={() => handleConfirmVehicle('Car', Car)}
        >
          <div className="flex flex-col items-start mb-2">
            <Car className="w-8 h-8 mb-2" />
            <span>Car</span>
            <span className="text-sm text-gray-500">Distance: {Number(distance||0).toFixed(1)} Km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Fare: ₹{Math.round(fare?.car||0)}</span>
          </div>
        </motion.button>

        <motion.button
          className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200"
          onClick={() => handleConfirmVehicle('Motorcycle', Bike)}
        >
          <div className="flex flex-col items-start mb-2">
            <Bike className="w-8 h-8 mb-2" />
            <span>Motorcycle</span>
            <span className="text-sm text-gray-500">Distance: {distance} Km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Fare: ₹{Math.round(fare?.motorcycle||0)}</span>
          </div>
        </motion.button>

        <motion.button
          className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200"
          onClick={() => handleConfirmVehicle('Auto', 'auto-icon')}
        >
          <div className="flex flex-col items-start mb-2">
            <img
              src="https://cdn-icons-png.flaticon.com/128/4682/4682997.png"
              className="w-8 h-8 mb-2"
              alt="Auto"
            />
            <span>Auto</span>
            <span className="text-sm text-gray-500">Distance: {Number(distance||0).toFixed(1)} Km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Fare: ₹{Math.round(fare?.auto||0)}</span>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}

export default LookingForDriver;
