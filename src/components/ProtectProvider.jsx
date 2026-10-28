"use client";
import React, { useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import {redirect} from 'next/navigation';

const ProtectProvider = ({children}) => {
    const {user, isAuth} = useSelector(store => store.user);
    console.info('user',user,'isAuth',isAuth);
    useLayoutEffect(() => {
        if(isAuth == false){
           // Back to the login page this browser last used (admin or DJ).
            let loginPath = '/login';
            try { if (localStorage.getItem('hg_login_path') === '/admin/login') loginPath = '/admin/login'; } catch { }
            redirect(loginPath);
        }else if (user && user?.isSubscriber === false){
            // window.location.pathname = '/subscribe';
            redirect('/subscribe');
        }
        console.log(user);
    },[user,isAuth]);
    return(<>{children}</>)
}

export default ProtectProvider