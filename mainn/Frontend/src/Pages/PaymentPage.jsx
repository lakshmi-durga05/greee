'use client';

import React, { useState } from 'react';
import { Star, IndianRupee, DollarSign, MapPin, Clock, Smartphone, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



export default function PaymentPage(props) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [rating, setRating] = useState(0);
  const {state}=useLocation()
  const nav=useNavigate()
  const {vehicle,captain}=state || {}

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem('usertoken'); 
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/ride/payment`,
        {
          rideId: vehicle._id,
          fare:vehicle.fare,
          paymentType:paymentMethod,          
          rating: String(rating),                 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include Bearer token in the header
          },
        }
      );
        if(response.status===200){
          nav('/home')
        }
    } catch (error) {
      console.error('Error during payment:', error.response?.data || error.message);
    }

  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
      >
        <div className="p-6">
          {/* Ride Summary Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Ride Summary</h1>
          </div>

          {/* Driver Info */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Captain John {captain?.fullname?.firstname}</h2>
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 cursor-pointer ${
                    i < rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => setRating(i + 1)}
                />
              ))}
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center space-x-3 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>RCM School, Ganesh Road, Phadke Haud, Kasba Peth, Pune, Maharashtra</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>25 Min</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
            <div className="space-y-3">
            
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="payment-method"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex items-center space-x-2">
                  <IndianRupee  className="w-5 h-5 text-gray-600" />
                  <span>Cash</span>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="payment-method"
                  value="mobile"
                  checked={paymentMethod === 'Online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <span>Online</span>
                </div>
              </label>
              
            </div>
          </div>

          {/* Total Amount */}
          <div className="mb-6 flex justify-between items-center text-gray-800">
            <span className="text-lg font-semibold">Total</span>   
            <div className="flex items-center space-x-2">
                  <IndianRupee  className="w-4 h-4 text-gray-600" />
                  {/* <span>{vehicle.fare}</span> */}
                </div> 
          </div>

          {/* Confirm Payment Button */}
          <button
            onClick={handlePayment}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            Confirm Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}
