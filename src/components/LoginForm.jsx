"use client";
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MdAlternateEmail, MdKey } from 'react-icons/md'
import axios from 'axios'
import { useSelector, useDispatch } from 'react-redux';
import { redirect, useRouter } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert'
import { toast } from 'react-toastify';

// Where a signed-out visitor is sent (ProtectProvider reads this), so an admin
// who logs out comes back to the admin login, not the DJ one.
export const LOGIN_PATH_KEY = 'hg_login_path';
export const ADMIN_LOGIN_PATH = '/admin/login';
export const DJ_LOGIN_PATH = '/login';

/**
 * The panel's login form. Two pages use it:
 *   /login        DJs (the link every DJ already has)
 *   /admin/login  the station admin
 * The client did not want an Admin/DJ switch on one page. The server checks
 * that the account matches the page it was used on (`as` in the request).
 */
const LoginForm = ({ variant = 'dj' }) => {
    const isAdmin = variant === 'admin';
    const label = isAdmin ? 'Admin' : 'DJ';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { isAuth, user } = useSelector(store => store.user);
    const dispatch = useDispatch();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const { data } = await axios.post('/api/v1/login', { email, password, as: variant });
            try { localStorage.setItem(LOGIN_PATH_KEY, isAdmin ? ADMIN_LOGIN_PATH : DJ_LOGIN_PATH); } catch { }
            router.push(data?.method === "app" ? "/verify?method=app" : "/verify")
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
        } catch (error) {
            await dispatch(showError(error.response?.data?.message || error.message));
            await dispatch(clearError());
        }
        setLoading(false);
    }

    const handleForgot = () => {
        if (isAdmin) {
            router.push('/forgot');
        } else {
            toast.info("Please ask the admin to reset your password");
        }
    }

    useEffect(() => {
        if (isAuth === true && user) {
            if (user?.isSubscriber) {
                redirect('/dashboard');
            } else {
                redirect('/subscribe');
            }
        }
    }, [isAuth, user])

    return (
        <section className='login-section h-screen'>
            <div className='container m-auto h-full flex justify-center items-center'>
                <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
                    <div className='py-4 flex justify-center items-center'>
                        <Image src="/images/logo.svg" width={200} height={300} className='w-28' alt="HGDJLive" />
                    </div>

                    <h1 className='text-2xl font-semibold text-black/90 text-center mb-2'>{label} Login</h1>

                    <form className='p-3 px-6' onSubmit={handleSubmit}>
                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="email" className='text-black text-lg'>{label} Email</label>
                            <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <MdAlternateEmail size={20} className='text-gray-400' />
                                <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your email' id='email' name='email' autoComplete='username' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-2'>
                            <label htmlFor="password" className='text-black text-lg'>{label} Password</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <MdKey size={20} className='text-gray-400' />
                                <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your password' id='password' name='password' autoComplete='current-password' required />
                            </div>
                        </div>

                        <p className='text-blue-600 cursor-pointer' onClick={handleForgot}>forgot password?</p>

                        <div className='flex justify-center items-center'>
                            <button type='submit' disabled={loading} className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all disabled:opacity-60'>{!loading ? 'Login' : 'Loading...'}</button>
                        </div>
                    </form>

                    {isAdmin && (
                        <p className='text-center text-sm text-gray-500 mt-2'>
                            DJ? <Link href={DJ_LOGIN_PATH} className='text-indigo-500 hover:underline'>Sign in on the DJ login</Link>
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}

export default LoginForm
