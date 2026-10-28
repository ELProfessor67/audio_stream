"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { redirect } from 'next/navigation';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';

// Wait between "Resend code" presses.
const RESEND_SECONDS = 30;

const Page = () => {
  const [OTP, setOTP] = useState(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);
  const { isAuth, user } = useSelector(store => store.user);
  const dispatch = useDispatch();
  // 'email' = code sent by email, 'app' = code from the authenticator app.
  const [method, setMethod] = useState('email');
  const [sendingEmail, setSendingEmail] = useState(false);
  // Seconds until "Resend code" can be pressed again. The first code was just
  // sent by the password step, so it starts counting from there.
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('method') === 'app') {
      setMethod('app');
    }
  }, []);

  const clearInputs = () => {
    setOTP(new Array(6).fill(''));
    inputsRef.current[0]?.focus();
  };

  const handleEmailInstead = async () => {
    setSendingEmail(true);
    try {
      const { data } = await axios.post('/api/v1/login/email-code');
      setMethod('email');
      clearInputs();
      setResendIn(RESEND_SECONDS);
      await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
    } catch (error) {
      await dispatch(showError(error.response?.data?.message || error.message));
      await dispatch(clearError());
    }
    setSendingEmail(false);
  };

  // The boxes are controlled by OTP state. They used to keep their own value
  // (defaultValue), so after a wrong digit the box and the state disagreed:
  // Backspace moved focus before deleting, and a filled box (maxLength 1)
  // refused a new digit. A wrong code could only be fixed by reloading.
  const setDigits = (startIndex, digits) => {
    const next = [...OTP];
    let i = startIndex;
    for (const d of digits) {
      if (i > 5) break;
      next[i] = d;
      i += 1;
    }
    setOTP(next);
    inputsRef.current[Math.min(i, 5)]?.focus();
  };

  const handleChange = (e, index) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      const next = [...OTP];
      next[index] = '';
      setOTP(next);
      return;
    }
    // Typing into a filled box replaces its digit (the new one is the last
    // character); several digits at once (autofill) spread across the boxes.
    if (digits.length === 2 && OTP[index]) setDigits(index, digits.slice(-1));
    else setDigits(index, digits);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...OTP];
      if (next[index]) {
        next[index] = '';
        setOTP(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setOTP(next);
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const next = [...OTP];
      next[index] = '';
      setOTP(next);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    e.preventDefault();
    const next = new Array(6).fill('');
    paste.split('').forEach((d, i) => { next[i] = d; });
    setOTP(next);
    inputsRef.current[Math.min(paste.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (resendIn > 0 || sendingEmail) return;
    setSendingEmail(true);
    try {
      const { data } = await axios.post('/api/v1/login/email-code');
      clearInputs();
      setResendIn(RESEND_SECONDS);
      await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
    } catch (error) {
      await dispatch(showError(error.response?.data?.message || error.message));
      await dispatch(clearError());
    }
    setSendingEmail(false);
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
      const { data } = await axios.post('/api/v1/verify', { OTP: fullOTP, method });
      dispatch({ type: 'loadUserSuc', payload: data });
      await dispatch(showMessage(data.message));
      await dispatch(clearMessage());
    } catch (error) {
      await dispatch(showError(error.response?.data?.message || error.message));
      await dispatch(clearError());
      // Wrong code: empty the boxes so it can be typed again straight away.
      clearInputs();
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
              <label className='block text-gray-700 mb-1 text-center'>
                {method === 'app' ? 'Enter the code from your authenticator app' : 'Enter OTP'}
              </label>
              <p className='text-gray-500 text-sm mb-3 text-center'>
                {method === 'app' ? 'Open the app on your phone and type the 6-digit code shown for HGDJLive.' : 'We sent a 6-digit code to your email.'}
              </p>
              <div
                className='flex justify-center gap-2'
                onPaste={handlePaste}
              >
                {OTP.map((digit, index) => (
                  <input
                    key={index}
                    type='text'
                    inputMode='numeric'
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${index + 1}`}
                    value={digit}
                    ref={(el) => (inputsRef.current[index] = el)}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
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

            <div className='flex justify-center items-center gap-4 mt-4 text-sm'>
              <button
                type='button'
                onClick={clearInputs}
                className='text-gray-600 hover:underline'
              >
                Clear
              </button>
              {method === 'email' && (
                <button
                  type='button'
                  onClick={handleResend}
                  disabled={resendIn > 0 || sendingEmail}
                  className='text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline'
                >
                  {sendingEmail ? 'Sending…' : resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                </button>
              )}
            </div>

            {method === 'app' && (
              <div className='flex justify-center mt-4'>
                <button
                  type='button'
                  onClick={handleEmailInstead}
                  disabled={sendingEmail}
                  className='text-blue-600 text-sm hover:underline disabled:opacity-50'
                >
                  {sendingEmail ? 'Sending…' : "Don't have your phone? Email me a code instead"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Page;
