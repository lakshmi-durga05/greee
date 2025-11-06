import React ,{useEffect,useState}from 'react'
import { useContext } from 'react'  
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../Context/CaptainContext';

function CaptainProtected({children}) {
const token=localStorage.getItem('captoken')    
    const nav=useNavigate()
    const [loading,setLoading]=useState(true)
    const {captain,setCaptain}=useContext(CaptainDataContext)

   useEffect(() => {
    if(!token){
        nav('/capLogin')
    }
    
    
    axios.get(`${import.meta.env.VITE_BASE_URL}/captain/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          // console.log(response.data.cap)
          setCaptain(response.data.cap);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        localStorage.removeItem(token);
        nav('/capLogin');
      })

   }, [token,nav,setCaptain]);

   if (loading) {
    return <h1>Loading.....</h1>;
  }
    return (
        <>
        {children}
        </>
        
    )
}

export default CaptainProtected
