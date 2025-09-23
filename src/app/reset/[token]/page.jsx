"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const ResetPasswordPage = ({ params }) => {
    const { token } = params;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(`/api/v1/reset-password/${token}`, { password });
            toast.success(data.message || 'Password reset successfully');
            router.push('/');
        } catch (error) {
            const msg = error?.response?.data?.message || 'Failed to reset password';
            toast.error(msg);
        }
        setLoading(false);
    }

    return (
        <section className='login-section h-screen'>
            <div className='container m-auto h-full flex justify-center items-center'>
                <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
                    <h1 className='text-2xl font-semibold text-center py-4'>Reset Password</h1>
                    <form className='p-3 px-6' onSubmit={handleSubmit}>
                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="password" className='text-black text-lg'>New Password</label>
                            <input type='password' id='password' name='password' value={password} onChange={(e) => setPassword(e.target.value)} className='w-full outline-none ml-1 py-2 px-3 border-2 border-gray-400 hover:border-indigo-500 rounded-md' placeholder='Enter new password' required />
                        </div>
                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="confirmPassword" className='text-black text-lg'>Confirm Password</label>
                            <input type='password' id='confirmPassword' name='confirmPassword' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='w-full outline-none ml-1 py-2 px-3 border-2 border-gray-400 hover:border-indigo-500 rounded-md' placeholder='Confirm new password' required />
                        </div>
                        <div className='flex justify-center items-center'>
                            <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>
                                {!loading ? 'Reset Password' : 'Resetting...'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default ResetPasswordPage;


