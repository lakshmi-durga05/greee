import React,{useEffect,createContext,useContext} from 'react'
import {io} from 'socket.io-client'
export const SocketContext=createContext()

export const SocketProvider=({children})=>{
    const socket=io(`${import.meta.env.VITE_BASE_URL}`,{
        transports:['polling'],
    })


    useEffect(()=>{
        socket.on('connect',()=>{
            console.log('Connected to server');
        }
        )


        socket.on('disconnect',()=>{
            console.log('Disconnected from server');
        })

        //When component unmounts then automaticlly disconnects the server
        // return()=>{
        //     socket.disconnect()
        // }
    },[])



    return(
        <SocketContext.Provider value={{socket}}>
            {children}
        </SocketContext.Provider>
    )
}