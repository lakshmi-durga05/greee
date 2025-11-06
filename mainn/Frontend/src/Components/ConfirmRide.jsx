import React,{useEffect,useState} from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import VehicleDetails from './VehicleDetails'; // Import VehicleDetails component
import axios from 'axios';
function ConfirmRide({ vehicle, onConfirm, onCancel }) {
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto"
      >
        {/* Display VehicleDetails component */}
        {vehicle && (
          <VehicleDetails
            vehicle={vehicle}
          />
        )}

        <div className="flex items-center justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Ride Confirmed!</h2>
        <p className="text-gray-600 mb-6 text-center">
          Your {vehicle.name} is on its way. Please proceed to make the payment.
        </p>
        <div className="space-y-4">
          <button
            className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800 
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            onClick={onConfirm}
          >
            Confirm Ride     
          </button>
          <button 
            variant="outline"
            className="w-full"
            onClick={onCancel}
          >
            Cancel Ride
          </button>
        </div>
      </motion.div>
    );
}

export default ConfirmRide;
