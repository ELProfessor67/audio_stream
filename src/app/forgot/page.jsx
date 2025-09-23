"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const ForgotPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/v1/forgot-password', { email });
            toast.success(data.message || 'Reset link sent to your email');
            router.push('/');
        } catch (error) {
            const msg = error?.response?.data?.message || 'Failed to send reset link';
            toast.error(msg);
        }
        setLoading(false);
    }

    return (
        <section className='login-section h-screen'>
            <div className='container m-auto h-full flex justify-center items-center'>
                <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
                    <h1 className='text-2xl font-semibold text-center py-4'>Forgot Password</h1>
                    <form className='p-3 px-6' onSubmit={handleSubmit}>
                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="email" className='text-black text-lg'>Email</label>
                            <input type='email' id='email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-full outline-none ml-1 py-2 px-3 border-2 border-gray-400 hover:border-indigo-500 rounded-md' placeholder='Enter your email' required />
                        </div>
                        <div className='flex justify-center items-center'>
                            <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>
                                {!loading ? 'Send Reset Link' : 'Sending...'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default ForgotPage;


