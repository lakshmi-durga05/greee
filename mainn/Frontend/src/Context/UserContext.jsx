import React, { useContext, createContext, useState, useEffect } from "react";

// Create context
export const UserDataContext = createContext();


export const UserContext = ({ children }) => {
    const [user, setUser] = useState({
        email: "",
        fullName: {
            firstName: "",
            lastName: ""
        }
    });

    return (
        <UserDataContext.Provider value={{ user, setUser }}>
            {children}
        </UserDataContext.Provider>
    );
};
