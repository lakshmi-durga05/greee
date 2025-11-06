import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
function UserLogout() {
    const nav=useNavigate()
    const token=localStorage.getItem('usertoken')


    useEffect(() => {
        const logoutUser = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/user/logout`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status === 200) {
                    localStorage.removeItem('usertoken');
                    nav('/login');
                }
            } catch (error) {
                console.error("Error during logout:", error);
            }
        };
    
        logoutUser();
    }, [nav, token]);
    
    return (
        <h1>User logout</h1>
    )
}

export default UserLogout
