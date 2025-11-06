import React, { useContext, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Header from '../Components/Header';
import { CaptainDataContext } from '../Context/CaptainContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function CapSignup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [color, setColor] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState(Number(1));
  const [errors, setErrors] = useState('')
  const nav=useNavigate()
  const {captain,setCaptain}=useContext(CaptainDataContext)
  const [phone, setPhone] = useState('')
  const handleSubmit =async (e) => {
    e.preventDefault();
    // sanitize phone similar to user: add +91 for 10 digits if no country code
    const digits = (phone || '').replace(/\D/g, '')
    const phoneToSend = (/^\+?\d{10,15}$/.test(phone)) ? phone : (digits.length===10 ? `+91${digits}` : phone)
    const newCap=({
      fullname: {
        firstname: firstName,
        lastname: lastName,
      },
      email: email,
      phone: phoneToSend,
      password: password,
      vehicle: {
        color: color,
        vehicleType: vehicleType,
        plate: plate,
        capacity: Number.parseInt(capacity,10) || 1,
      },
    });
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captain/register`,newCap );
      if(response.status===201){
        const data=response?.data
        setCaptain(data.newCap)
        nav('/capLogin')
        return
      }
      setErrors(response?.data?.message || 'Unable to create captain account')
    } catch (err) {
      if (err?.response) {
        const api = err.response.data
        const firstErr = Array.isArray(api?.errors) && api.errors.length ? (api.errors[0]?.msg || api.errors[0]) : null
        setErrors(firstErr || api?.message || 'Failed to create account')
      } else {
        setErrors(`Network error. Check VITE_BASE_URL and backend (${import.meta.env.VITE_BASE_URL}).`)
      }
    }
  

    setFirstName('');
    setLastName('');
    setEmail('');
   
    setPassword('');
    setColor('');
    setVehicleType('');
    setPlate('');
    setCapacity(1);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <form className="max-w-sm w-full p-6" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
            Welcome Aboard New Captain
          </h2>
          {errors && (
            <p className="text-red-500 text-center mb-3">{errors}</p>
          )}

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Your email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Mobile number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="e.g., +919999999999"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>


          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Vehicle Color
              </label>
              <input
                type="text"
                name="color"
                id="color"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Color"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Vehicle Type
              </label>
              <select
                name="type"
                id="type"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="Car">Car</option>
                <option value="Auto">Auto</option>
                <option value="Motorcycle">Motorcycle</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
              <label htmlFor="plate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Vehicle Plate
              </label>
              <input
                type="text"
                name="plate"
                id="plate"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Plate Number"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>
            <div className="relative z-0 w-full mb-5 group">
              <label htmlFor="capacity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Vehicle Capacity
              </label>
              <input
                type="number"
                name="capacity"
                id="capacity"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Capacity"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="mb-5 relative">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Your password
            </label>
            <div className="relative">
              <input
                name="password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {showPassword ? (
                <EyeIcon
                  className="w-6 h-6 absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 dark:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <EyeOffIcon
                  className="w-6 h-6 absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 dark:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Create a new Account
          </button>
        </form>
      </div>
    </>
  );
}

export default CapSignup;
