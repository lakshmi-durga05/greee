import React,{useState,useCallback,useContext} from 'react';
import { useNavigate,Link } from 'react-router-dom';
import Header from '../Components/Header';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import axios from 'axios';
import { UserDataContext } from '../Context/UserContext';

function UserLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const nav=useNavigate()
      const {user,setUser}=useContext(UserDataContext)
      const [role, setRole] = useState('customer')
      const [showForgot,setShowForgot]=useState(false)
      const [fpEmail,setFpEmail]=useState('')
      const [fpNewPwd,setFpNewPwd]=useState('')
      const [fpMsg,setFpMsg]=useState('')
      const [errors,setErrors]=useState('')

      const handleSubmit = async (e) => {
        e.preventDefault();
        
        const existUser = {
          email: email,
          password: password,
        };
      
        try {
          const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/user/login`, existUser);
      
          if (res.status === 200) {
            const data = res.data;
            console.log(data.message);
            if (data?.token) {
              localStorage.setItem('usertoken', data.token);
            }
            if (data?.user?._id) {
              localStorage.setItem('userId', data.user._id);
            }
            nav('/home');
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
        }

  return (
    <>
    <Header />
<div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 dark:bg-gray-900 pt-4">
  <form className="max-w-sm w-full p-4 mt-4" onSubmit={handleSubmit}>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">Welcome Back!</h2>
    {errors && <p className="text-red-500 text-center mb-3">{errors}</p>}
    <div className="mb-3">
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Sign in as</label>
      <select
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        value={role}
        onChange={(e) => {
          const v = e.target.value;
          setRole(v);
          if (v === 'driver') nav('/capLogin');
        }}
      >
        <option value="customer">Customer</option>
        <option value="driver">Driver</option>
      </select>
    </div>
    <div className="mb-3">
      <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

    <div className="mb-5 relative">
      <label
        htmlFor="password"
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        Your password
      </label>
      <div className="relative">
        <input
          name="password"
          type={showPassword ? "text" : "password"}
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
      className="w-full text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mb-4"
    >
      Sign In
    </button>

    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-300 mb-4">
      <button type="button" className="hover:underline" onClick={()=>{ setShowForgot(true); setFpEmail(email||''); setFpMsg(''); setFpNewPwd(''); }}>Forgot password?</button>
    </div>

    <div className="flex justify-center items-center text-sm text-gray-500 dark:text-gray-300 mb-6">
      <p>Don't have an account? 
        <a href="/signUp" className="text-blue-600 hover:underline ml-1">Sign Up</a>
      </p>
    </div>

    {/* Captain Sign In Button */}
    <Link to="/capLogin">
      <button
        type="button"
        className="w-full text-white bg-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-900"
      >
        Sign In as Captain
      </button>
    </Link>
  </form>
</div>

{showForgot && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Reset Password</h3>
      {fpMsg && <p className={`mb-2 text-sm ${/success/i.test(fpMsg)?'text-green-600':'text-red-600'}`}>{fpMsg}</p>}
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
      <input type="email" value={fpEmail} onChange={e=>setFpEmail(e.target.value)} className="w-full mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="you@example.com" />
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New password</label>
      <input type="password" value={fpNewPwd} onChange={e=>setFpNewPwd(e.target.value)} className="w-full mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="At least 6 characters" />
      <div className="flex gap-2">
        <button type="button" disabled={fpNewPwd.length<6||!fpEmail} onClick={async()=>{
          try{ setFpMsg('');
            await axios.post(`${import.meta.env.VITE_BASE_URL}/user/forgot/resetNoOtp`,{ email: fpEmail, newPassword: fpNewPwd })
            setFpMsg('Password reset successful. You can sign in now.')
            setShowForgot(false)
          }catch(err){ setFpMsg(err?.response?.data?.message||'Failed to reset password') }
        }} className="flex-1 bg-black text-white py-2 rounded disabled:opacity-50">Reset</button>
        <button type="button" onClick={()=>setShowForgot(false)} className="px-4 py-2 rounded border">Close</button>
      </div>
    </div>
  </div>
)}

    </>
  );
}

export default UserLogin;
