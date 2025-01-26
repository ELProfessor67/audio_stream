"use client";
import React, { useState,useEffect, useCallback } from 'react'
import Image from 'next/image'
import {MdAlternateEmail,MdKey} from 'react-icons/md'
import Link from 'next/link'
import axios from 'axios'
import {useSelector,useDispatch} from 'react-redux';
import {redirect} from 'next/navigation';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert'
import { toast } from 'react-toastify';

const page = () => {
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [loading,setLoading] = useState(false);
    const {isAuth,user} = useSelector(store => store.user);
    const dispatch = useDispatch();
    const [type, setType] = useState('Admin');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const {data} = await axios.post('/api/v1/login',{email,password});
            dispatch({type: 'loadUserSuc',payload: data});
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            console.log(data.message);
        } catch (error) {
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
            console.log(error.response.data.message)
        }
        setLoading(false);

    }


    const handleForgot = useCallback(() => {
        if(type == "Admin"){
            toast.success("Forgot password link successfully send to your email.");
        }else{
            toast.success("Please request admin to forgot your password");
        }
    },[type])

    useEffect(() => {
        if(isAuth === true && user){
            if(user?.isSubscriber){
                redirect('/dashboard');
            }else{
                redirect('/subscribe');
            }
        }
    },[isAuth,user])


  return (
    <section className='login-section h-screen'>
        <div className='container m-auto h-full flex justify-center items-center'>
        <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
                <div className='py-4 flex justify-center items-center'>
                    <Image src="/images/logo.svg" width={200} height={300} className='w-28'/>
                </div>

                <div className='div p-3 px-20 flex justify-between items-center mb-2'>
                    <button className={`text-xl font-semibold text-black/90 pb-1 ${type == 'Admin'? 'border-b-4 border-indigo-500' : '' }`} onClick={() => setType('Admin')}>Admin</button>
                    <button className={`text-xl font-semibold text-black/90 pb-1 ${type == 'DJ'? 'border-b-4 border-indigo-500' : '' }`} onClick={() => setType('DJ')}>DJ</button>
                </div>
                <form className='p-3 px-6' onSubmit={handleSubmit}>
                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="email" className='text-black text-lg'>{type} Email</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdAlternateEmail size={20} className='text-gray-400'/>
                            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your email' id='email' name='email' required/>
                        </div>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-2'>
                        <label for="password" className='text-black text-lg'>{type} Password</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdKey size={20} className='text-gray-400'/>
                            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your password' id='password' name='password' required/>
                        </div>   
                    </div>
                    
                    <p className='text-blue-600 cursor-pointer' onClick={handleForgot}>forgot password?</p>

                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Login' : 'Loading...'}</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
  )
}

export default page