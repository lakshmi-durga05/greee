import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";



function SosForm() {
  const [reason, setReason] = useState("");
  const navigate = useNavigate();
  const [latitude,setLatitude]=useState()
  const [longitude,setLongitude]=useState()
  const {state}=useLocation()
  const [message,setMessage]=useState("")
  const [error,setError]=useState("")

  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude); 
            setLongitude(position.coords.longitude); 
            setError(null); 
          },
          (err) => {
            setError("Unable to retrieve your location. Please enable location services.");
            console.error("Geolocation error:", err);
          }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
      }
    };

    getCurrentLocation();

  }, []); // Empty dependency array to run only once on mount
  const handleSubmit = async(e) => {
    e.preventDefault();
    if (reason.trim()) {
      // console.log("SOS Sent with reason:", reason);
      const response=await axios.post(`${import.meta.env.VITE_BASE_URL}/ride/sendSos`,{
        rideId:state ,
        latitude,
        longitude,
        reason:reason,
      })
      if(response.status===200){
        console.log(response.data);
        setMessage(response.data.Message)
      }
    //   navigate("/ride-started"); // Navigate back after sending SOS
    } else {
      alert("Please provide a reason for the SOS alert.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">SOS Alert</h2>
        <p className="mb-4">Please provide a reason for the SOS alert:</p>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded-lg mb-4"
            rows="4"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter your reason..."
          ></textarea>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Confirm SOS
            </button>
          </div>
        </form>
        <h2 className="text-xl font-bold mb-4">{message}</h2>
      </div>
    </div>
  );
}

export default SosForm;
