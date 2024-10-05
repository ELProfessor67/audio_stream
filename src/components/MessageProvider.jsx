"use client";
import React,{useRef} from 'react'
import { useEffect } from 'react'
import { useDispatch,useSelector } from 'react-redux'
import { toast } from 'react-toastify';


const MessageProvider = ({children}) => {

    const dispatch = useDispatch();
    
    const {message,error} = useSelector(store => store.message);
    console.log(message,error);
    useEffect(() => {
        console.info('alert',message,error);
        if(message){
            toast.success(message);
        }
        if(error){
            toast.error(error)
        }
    },[message,error]);
  return (
    <>
        {children}
    </>
  )
}

export default MessageProvider