import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS
import { connectLiveWS } from "../utils/liveWS";

const LiveTracking = ({ driverId }) => {
  const [currentLocation, setCurrentLocation] = useState({
    lat: 0,
    lng: 0,
  });
  const wsRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    const mapContainer = document.getElementById("map"); // Assuming the container is pre-initialized

    if (!mapContainer) {
      console.error("Map container not found");
      return;
    }

    // Initialize the map if not already initialized
    if (!mapRef.current) {
      const leafletMap = L.map(mapContainer).setView([0, 0], 15);
      mapRef.current = leafletMap

      // Add a tile layer (you can use any tile service here)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(leafletMap);

      // Add marker for current location
      const marker = L.marker([0, 0]).addTo(leafletMap);
      markerRef.current = marker

      // If tracking a driver, subscribe via WS
      if (driverId) {
        const ws = connectLiveWS()
        wsRef.current = ws
        ws.join("client-viewer", "user")
        ws.subscribe(driverId)
        const onMsg = (ev) => {
          try {
            const data = JSON.parse(ev.data)
            if (data.type === "driver_location" && data.id === String(driverId)) {
              const { lat, lng } = data.coords || {}
              if (typeof lat === "number" && typeof lng === "number") {
                setCurrentLocation({ lat, lng })
                marker.setLatLng([lat, lng])
                leafletMap.setView([lat, lng], 15)
              }
            }
          } catch {}
        }
        ws.ws.addEventListener("message", onMsg)
        return () => {
          try { ws.unsubscribe(driverId) } catch {}
          try { ws.ws.removeEventListener("message", onMsg) } catch {}
          try { ws.ws.close() } catch {}
        }
      }

      // Else fallback to user's own location
      const fetchLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentLocation({
                lat: latitude,
                lng: longitude,
              });
              marker.setLatLng([latitude, longitude]); // Update marker position
              leafletMap.setView([latitude, longitude], 15); // Update map center
            },
            (error) => {
              console.error("Error fetching location:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        } else {
          console.error("Geolocation is not supported by this browser.");
        }
      };

      fetchLocation(); // Fetch initial location
      const intervalId = setInterval(fetchLocation, 5000); // Update every 5 seconds

      return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }
  }, [driverId]);

  return (
    <div>
      <div id="map" style={{ width: "100%", height: "400px" }}></div>
    </div>
  );
};

export default LiveTracking;
