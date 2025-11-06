import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';

function LocationInput({ placeholder, icon: Icon = MapPin, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {}
    );
  }, []);

  // abort controllers for in-flight requests
  const [aborterFast, setAborterFast] = useState(null)
  const [aborterFull, setAborterFull] = useState(null)

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true);
    setError(null);

    try {
      // cancel previous
      if (aborterFast) { try { aborterFast.abort() } catch {} }
      if (aborterFull) { try { aborterFull.abort() } catch {} }

      // FAST request: global only, small limit for instant feedback
      const fastCtrl = new AbortController()
      setAborterFast(fastCtrl)
      const fastPromise = axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/getSuggestion`,
        { params: { input: query, limit: 5, fast: 1 }, signal: fastCtrl.signal }
      ).then(r => r.data?.suggestions || []).then(list =>
        (list || []).map(it => typeof it === 'string' ? { title: it, display_name: it } : it)
      ).catch(() => [])

      // FULL request: nearby-biased with GPS
      const fullCtrl = new AbortController()
      setAborterFull(fullCtrl)
      const fullPromise = axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/getSuggestion`,
        { params: { input: query, lat: coords?.lat, lng: coords?.lng, limit: 8 }, signal: fullCtrl.signal }
      ).then(r => r.data?.suggestions || []).then(list =>
        (list || []).map(it => typeof it === 'string' ? { title: it, display_name: it } : it)
      ).catch(() => [])

      // Show fast results as soon as they arrive
      fastPromise.then(list => {
        if (list && list.length) setSuggestions(list.filter(x => x && (x.display_name || x.title)))
      })
      // Then merge full results
      const fullList = await fullPromise
      if (fullList && fullList.length) {
        setSuggestions(prev => {
          const seen = new Set()
          const merged = []
          const add = (arr) => arr.forEach(it => {
            if (!it) return
            const val = it.display_name || it.title
            if (!val) return
            const k = val + (it.subtitle || '')
            if (!seen.has(k)) { seen.add(k); merged.push(it) }
          })
          add(prev || [])
          add(fullList)
          return merged
        })
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return
      }
      // console.error('Error fetching location suggestions:', error);
      setError('');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // debounce user input
  const [pendingQuery, setPendingQuery] = useState('')
  useEffect(() => {
    const id = setTimeout(() => {
      if (pendingQuery !== '') fetchSuggestions(pendingQuery)
    }, 350)
    return () => clearTimeout(id)
  }, [pendingQuery])

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setPendingQuery(newValue)
  };

  const handleSuggestionClick = (suggestion) => {
    const value = suggestion.display_name || suggestion.title || ''
    onChange(value);
    setSuggestions([]);
    setIsFocused(false);
  };

  const useMyLocation = async () => {
    if (!coords) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/reverseGeocode`, { params: { lat: coords.lat, lng: coords.lng } })
      if (res.status === 200 && res.data?.address) {
        onChange(res.data.address)
        setSuggestions([])
        setIsFocused(false)
      }
    } catch (e) {}
  }

  return (
    <div className="relative mb-4">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsFocused(false);
          }, 200);
        }}
        className="w-full p-3 pl-10 pr-4 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

      {isFocused && (suggestions.length > 0 || coords) && (
        <ul className="absolute bg-white w-full mt-2 rounded-lg shadow-lg border border-gray-300 z-10 max-h-60 overflow-y-auto">
          {coords && (
            <li
              className="p-2 hover:bg-gray-100 cursor-pointer font-medium text-blue-600"
              onMouseDown={(e) => { e.preventDefault(); useMyLocation(); }}
            >
              Use my current location
            </li>
          )}
          {suggestions.map((s, index) => (
            <li
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(s);
              }}
            >
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 text-sm">{s.title || s.display_name}</div>
                  {s.subtitle && <div className="text-xs text-gray-500">{s.subtitle}</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-2 text-center text-gray-500">
          Loading...
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 text-center text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}

export default LocationInput;

