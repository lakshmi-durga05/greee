"use client";

import { useContext, useState, useEffect } from "react";
import { Search, MapPin, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { LocationInput, RecentTrips, LookingForDriver, OffersSection } from "../Components";
import { SocketContext } from "../Context/SocketContext";
import { UserDataContext } from "../Context/UserContext";
import { useNavigate } from "react-router-dom";

const RideTypeButton = ({ icon: Icon, label, onClick }) => (
  <button
    className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    onClick={onClick}
  >
    <Icon className="w-6 h-6 mb-2" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default function UserHomePage() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [showDriverSearch, setShowDriverSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);
  const nav=useNavigate()
  useEffect(() => {
    if (socket && user) {
      socket.emit("join", { userId: user._id, role: "user" });
    }
  }, [user, socket]);

  useEffect(() => {
    const prefillPickup = async () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const url = `${import.meta.env.VITE_BASE_URL}/maps/reverseGeocode?lat=${latitude}&lng=${longitude}`
          const res = await fetch(url)
          if (res.ok) {
            const data = await res.json()
            if (data?.address) setPickup(data.address)
          }
        } catch (e) {
          // silently ignore
        }
      });
    };
    prefillPickup();
  }, []);

  const handleBack = () => {
    if (showDriverSearch) {
      setShowDriverSearch(false);
    }
  };

  const handlePickupChange = (value) => {
    setPickup(value);
  };

  const handleDropChange = (value) => {
    setDrop(value);
  };

  const handleLogout = () => {
    nav('/user/logout')
    // Implement logout logic here
    console.log("Logging out...");
  };
  const goProfile=()=>{
    nav('/user/profile')
  }
  // console.log(user)
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Welcome, {user?.fullname?.firstname}</h1>
        <div className="relative">
          <button
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <User className="w-6 h-6 mr-2" />
            <span onClick={goProfile}>Profile</span>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 inline-block mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        {showDriverSearch ? (
          <motion.div key="driver-search">
            <LookingForDriver pickup={pickup} drop={drop} onBack={handleBack} />
          </motion.div>
        ) : (
          <motion.div key="main-view">
            <div className="mb-6">
              <LocationInput
                placeholder="Enter pickup location"
                icon={MapPin}
                value={pickup}
                onChange={handlePickupChange}
              />
              <LocationInput
                placeholder="Enter drop location"
                icon={MapPin}
                value={drop}
                onChange={handleDropChange}
              />
              <button
                className="w-full bg-black text-white p-3 rounded-lg mt-2 flex items-center justify-center"
                onClick={() => setShowDriverSearch(true)}
              >
                <Search className="w-5 h-5 mr-2" />
                Find a Ride
              </button>
            </div>

            <RecentTrips />

            <OffersSection />
            
          </motion.div>
        )}
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <button className="w-full sm:w-auto border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-100 transition duration-300"
            onClick={handleLogout}
            >
              Logout
            </button>
            </div>
      </main>
    </div>
  );
}