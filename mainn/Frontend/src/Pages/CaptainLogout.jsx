import React,{useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
function CaptainLogout() {
    const token=localStorage.getItem('captoken')
    const nav=useNavigate()
    useEffect(() => {
            if (!token) {
              nav('/capLogin');
              return; // Prevent making API call if no token exists
            }
   axios.get(`${import.meta.env.VITE_BASE_URL}/captain/logout`,{
    headers:{
        Authorization:`Bearer ${token}`
    }
   }).then((res)=>{
    if(res.status===200){
        nav('/capLogin')
        localStorage.removeItem(token)
    }
   }).catch(err=>{
    console.log(err);
   })
    }, [token,nav]);
    return <h1>Cap logout</h1>
}

export default CaptainLogout
