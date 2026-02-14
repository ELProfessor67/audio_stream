"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { redirect } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';

const Page = () => {
  const [OTP, setOTP] = useState(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);
  const { isAuth, user } = useSelector(store => store.user);
  const dispatch = useDispatch();

  const handleInput = (e, index) => {
    const value = e.target.value.replace(/\D/, '');
    const newOTP = [...OTP];

    if (e.key === 'Backspace') {
      newOTP[index] = '';
      setOTP(newOTP);
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (value) {
      newOTP[index] = value;
      setOTP(newOTP);
      if (index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const newOTP = paste.split('');
      setOTP(newOTP);
      newOTP.forEach((_, i) => {
        if (inputsRef.current[i]) {
          inputsRef.current[i].value = newOTP[i];
        }
      });
      inputsRef.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOTP = OTP.join('');
    if (fullOTP.length < 6) {
      dispatch(showError('Please enter full 6-digit OTP'));
      await dispatch(clearError());
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/v1/verify', { OTP: fullOTP });
      dispatch({ type: 'loadUserSuc', payload: data });
      await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
    } catch (error) {
      await dispatch(showError(error.response.data.message));
      await dispatch(clearError());
      console.log(error.response.data.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuth && user) {
      // Check if user is a DJ
      if (user?.isDJ === false) {
        // Not a DJ, check subscription and redirect to dashboard
        if (user?.isSubscriber) {
          redirect('/dashboard');
        } else {
          redirect('/subscribe');
        }
      } else if (user?.isDJ === true) {
        // Is a DJ, check if forms are filled
        if (user?.volunteerForm && user?.executiveLegalForm) {
          // Forms are filled, redirect to dashboard
          redirect('/dashboard');
        } else {
          // Forms not filled, redirect to DJ forms page
          redirect('/dj-forms');
        }
      }
    }
  }, [isAuth, user]);

  return (
    <section className='login-section h-screen'>
      <div className='container m-auto h-full flex justify-center items-center'>
        <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
          <div className='py-4 flex justify-center items-center'>
            <Image src="/images/logo.svg" width={200} height={300} className='w-28' alt="Logo" />
          </div>
          <form className='p-3 px-6' onSubmit={handleSubmit}>
            <div className='mb-6'>
              <label className='block text-gray-700 mb-2 text-center'>Enter OTP</label>
              <div
                className='flex justify-center gap-2'
                onPaste={handlePaste}
              >
                {OTP.map((digit, index) => (
                  <input
                    key={index}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    defaultValue={digit}
                    ref={(el) => (inputsRef.current[index] = el)}
                    onChange={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleInput(e, index)}
                    className='w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                ))}
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <button
                type='submit'
                className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'
                disabled={loading}
              >
                {!loading ? 'Verify' : 'Loading...'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Page;
