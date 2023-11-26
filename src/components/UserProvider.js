"use client";
import React from 'react'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { loadme } from '@/redux/action/user'

const UserProvider = ({children}) => {

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(loadme());
    },[]);
  return (
    <>
        {children}
    </>
  )
}

export default UserProvider