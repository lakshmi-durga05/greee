import React, { useContext, useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { UserDataContext } from '../Context/UserContext';
import axios from 'axios'



function UserSignup() {
    const {user, setUser} = useContext(UserDataContext)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState('')
const nav=useNavigate()
  const [role, setRole] = useState('customer')
  const [phone, setPhone] = useState('')

  const handleSubmit=async(e)=>{
    e.preventDefault()
   // sanitize phone: if 10 digits and no country code, prefix +91; otherwise keep as typed
   const digits = (phone || '').replace(/\D/g, '')
   const phoneToSend = (/^\+?\d{10,15}$/.test(phone)) ? phone : (digits.length===10 ? `+91${digits}` : phone)
   const newUser=(
      {
        fullname:{
          firstname:firstName,
          lastname:lastName,
        },
        email:email,
        password:password,
        phone: phoneToSend
      }
    )
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/user/register`, newUser);
      if(response.status===201){
        const data=response?.data
        setUser(data.Newuser)
        if (data?.token) {
          localStorage.setItem('usertoken', data.token)
        }
        if (data?.Newuser?._id) {
          localStorage.setItem('userId', data.Newuser._id)
        }
        nav('/home')
        return
      }
      const msg = response?.data?.message
      if (msg === 'User already exists') {
        nav('/login')
        return
      }
      setErrors(msg || 'Unable to create account.')
    } catch (err) {
      if (err?.response) {
        const api = err.response.data
        const firstErr = Array.isArray(api?.errors) && api.errors.length ? (api.errors[0]?.msg || api.errors[0]) : null
        setErrors(firstErr || api?.message || 'Failed to create account')
      } else {
        setErrors('Network error. Check VITE_BASE_URL and backend (http://localhost:3000).')
      }
    }




    setEmail('')
    setFirstName('')
    setLastName('')
    setPassword('')
    
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <form className="max-w-sm w-full p-6" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
            Create a new Account
          </h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Sign up as</label>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={role}
              onChange={(e) => {
                const v = e.target.value;
                setRole(v);
                if (v === 'driver') nav('/capSignup');
              }}
            >
              <option value="customer">Customer</option>
              <option value="driver">Driver</option>
            </select>
          </div>
          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-5 group">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
             First Name
            </label>
              <input
                type="text"
                name="firstName"
                id="floating_first_name"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
           
            </div>
            <div className="relative z-0 w-full mb-5 group">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
             Last Name
            </label>
              <input
                type="text"
                name="lastName"
                id="floating_last_name"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder=" "
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
       
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Mobile number
            </label>
            <input
              type="tel"
              name="phone"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="e.g., +919999999999"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mb-5 relative">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

          <div className="flex items-start mb-5">
            <div className="flex items-center h-5">
              <input
                id="remember"
                type="checkbox"
                value=""
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
              />
            </div>
            <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full text-white bg-black hover:bg-gray- focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mb-4"
          >
            Create Account
          </button>

          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-300 mb-4">
            <a href="/forgot-password" className="hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </>
  );
}

export default UserSignup;
