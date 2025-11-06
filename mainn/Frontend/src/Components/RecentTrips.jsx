import React, { useState,useCallback,useEffect } from "react"
import {ArrowRight,MapPin } from 'lucide-react';
import axios from "axios";


const RecentTrips=()=>{
  const token=localStorage.getItem('usertoken')
   const [recentTrips,setRecenttrips]=useState([])
  useEffect(() => {
    const seeRides = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/ride/seeRides`,
          {
            params: { requirement: 'pending' }, // Use `params` for query parameters
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (response.status === 200) {
          setRecenttrips(response.data.rides); // Update state with the fetched rides
        }
      } catch (error) {
        console.error('Error fetching rides:', error); // Add error handling
      }
    };
  
    seeRides();
  }, []);

      return(
        <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Trips</h2>
        <div className="space-y-4">
          {recentTrips.map((trip) => (
            <div key={trip._id} className="flex items-center bg-gray-50 p-3 rounded-lg">
              <MapPin className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <h3 className="font-medium">{trip.pickup} → {trip.destination}</h3>
                <p className="text-sm text-gray-500">{trip.status}</p>
              </div>
              <ArrowRight className="ml-auto text-gray-400" />
            </div>
          ))}
        </div>
      </section>
      )
}
export default RecentTrips