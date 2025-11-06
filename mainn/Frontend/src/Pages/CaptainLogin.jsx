import React,{useContext, useState} from 'react';
import { Link , useNavigate} from 'react-router-dom';
import Header from '../Components/Header';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { CaptainDataContext } from '../Context/CaptainContext';
import axios from 'axios';
import { SocketContext } from '../Context/SocketContext';
export function CapLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const {captain,setCaptain}=useContext(CaptainDataContext)
    const { socket } = useContext(SocketContext)
    const [locationText, setLocationText] = useState('')
    const nav=useNavigate()
    const handleSubmit=async(e)=>{
        e.preventDefault()
        const existUser=({
          email:email,
          password:password
         })
         try {
          const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/captain/login`, existUser);
          if (res.status === 200) {
            const data = res.data;
            console.log(data.message);
            if (data?.token) {
              localStorage.setItem('captoken', data.token)
            }
            // set captain context for downstream pages
            if (data?.captain) {
              setCaptain(data.captain)
              try {
                if (socket && data.captain._id) {
                  // join as captain
                  socket.emit('join', { userId: data.captain._id, role: 'captain' })
                  // if user provided a location, geocode and send update-location
                  if (locationText && locationText.trim().length > 0) {
                    const geo = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/getCo-ordinates`, {
                      params: { address: locationText }
                    })
                    const lat = geo?.data?.latitude ?? geo?.data?.coordinates?.lat
                    const lng = geo?.data?.longitude ?? geo?.data?.coordinates?.lng
                    if (typeof lat === 'number' && typeof lng === 'number') {
                      socket.emit('update-location', { id: data.captain._id, location: { lat, lng } })
                    }
                  }
                }
              } catch (_) { /* ignore socket issues here */ }
            }
            nav('/caphome');
          }
        } catch (err) {
          if (err.response) {
            if (err.response.status === 400) {
              setErrors(err.response.data.message || 'Invalid credentials. Please try again.');
            } else {
              setErrors(err.response.data.message || 'Something went wrong. Please try again later.');
            }
          } else {
            setErrors('An unexpected error occurred. Please check your connection and try again.');
          }
        }
      };
      
    const [errors,setErrors]=useState('')
  return (
    <>
    <Header />
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 dark:bg-gray-900 pt-4">
    <form
        className="sm:max-w-sm w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
          Welcome Back! Cap About Time
        </h2>
        {errors && <p className="text-red-500 text-center mb-3">{errors}</p>}
        <div className="mb-3">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your email
          </label>
          <input
            type="email"
            value={email}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Your email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
  
        <div className="mb-5">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Your password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 pr-10"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
  
        <div className="mb-5">
          <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Your current location (address)
          </label>
          <input
            id="location"
            type="text"
            placeholder="e.g., Visakhapatnam"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={locationText}
            onChange={(e)=>setLocationText(e.target.value)}
          />
        </div>

        <div className="flex items-start mb-5">
          <div className="flex items-center h-5">
            <input
              id="remember"
              type="checkbox"
              value=""
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
            />
          </div>
          <label
            htmlFor="remember"
            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Remember me
          </label>
        </div>
  
        <button
          type="submit"
          className="w-full text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Sign In
        </button>
  
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-300 mt-4">
          <a href="/forgot-password" className="hover:underline">
            Forgot password?
          </a>
        </div>
  
        <div className="flex justify-center items-center text-sm text-gray-500 dark:text-gray-300 mt-4">
          <p>
            Join as a Driver?{" "}
            <a
              href="/capSignup"
              className="text-blue-600 hover:underline ml-1"
            >
              Sign Up
            </a>
          </p>
        </div>
  
        <Link to="/login">
          <button
            type="button"
            className="w-full mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-700 dark:hover:bg-gray-800"
          >
            Sign In as User
          </button>
        </Link>
      </form>
    </div>
  </>
  
  );
}


