"use client";
import React, { useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import {redirect} from 'next/navigation';

const ProtectProvider = ({children}) => {
    const {user, isAuth} = useSelector(store => store.user);
    console.info('user',user,'isAuth',isAuth);
    useLayoutEffect(() => {
        if(isAuth == false){
           // window.location.pathname = '/login';
            redirect('/login');
        }else if (user && user?.isSubscriber === false){
            // window.location.pathname = '/subscribe';
            redirect('/subscribe');
        }
        console.log(user);
    },[user,isAuth]);
    return(<>{children}</>)
}

export default ProtectProvider