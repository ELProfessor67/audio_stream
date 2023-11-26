"use client";
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

const ProtectProvider = ({children}) => {
    const {user, isAuth} = useSelector(store => store.user);
    
    useEffect(() => {
        if(isAuth == false){
           window.location.pathname = '/login';
        }else if (user && user?.isSubscriber === false){
            window.location.pathname = '/subscribe';
        }
        console.log(user);
    },[user]);
    return(<>{children}</>)
}

export default ProtectProvider