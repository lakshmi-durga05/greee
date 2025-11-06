import React,{createContext,useState,useContext} from "react";


export const CaptainDataContext=createContext()

export const CaptainContext=({children})=>{
    const [captain,setCaptain]=useState({
        email:"",
        fullName: {
            firstName: "",
            lastName: ''
        }
    })

    return(
        <CaptainDataContext.Provider value={{captain,setCaptain}}>
            {children}
        </CaptainDataContext.Provider>
    )
}