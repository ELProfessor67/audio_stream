"use client";
import React, { useState } from 'react'
import Image from 'next/image'
import {MdAlternateEmail,MdKey} from 'react-icons/md'
import Link from 'next/link'
import axios from 'axios'

const page = () => {
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const {data} = await axios.post('/api/v1/login',{email,password});
            console.log(data.message);
            window.location.pathname = '/dashboard';
            
        } catch (error) {
            console.log(error.response.data.message)
        }

    }
  return (
    <section className='login-section h-screen'>
        <div className='container m-auto h-full flex justify-center items-center'>
        <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
                <div className='py-4 flex justify-center items-center'>
                    <Image src="/images/logo.svg" width={200} height={300} className='w-28'/>
                </div>
                <form className='p-3 px-6' onSubmit={handleSubmit}>
                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="email" className='text-black text-lg'>Email</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdAlternateEmail size={20} className='text-gray-400'/>
                            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your email' id='email' name='email' required/>
                        </div>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="password" className='text-black text-lg'>Password</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdKey size={20} className='text-gray-400'/>
                            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your password' id='password' name='password' required/>
                        </div>   
                    </div>

                    <div className='input-group flex items-center justify-between mb-6'>
                        <p className='text-lg text-black'>If you {`don't`} have account <Link className='text-indigo-500 hover:underline' href={'/register'}>Sign Up</Link></p>  
                        <p className='text-lg text-black'><Link className='text-indigo-500 hover:underline' href={'/forgot-password'}>Forgot Password</Link></p>  
                    </div>

                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>Login</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
  )
}

export default page