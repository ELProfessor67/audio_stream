import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import {MdAlternateEmail,MdKey} from 'react-icons/md'
import {FaArrowLeft} from 'react-icons/fa'
import {AiOutlineUser,AiOutlineFieldTime} from 'react-icons/ai'
import {FaEarthAsia, FaRadio,FaClock} from 'react-icons/fa6'
import {CgWebsite} from 'react-icons/cg'
import Link from 'next/link'
import { plansData } from '@/constants'
import PlanCard from './PlanCard'
import {getNames} from 'country-list';
import timezones from 'timezones-list';
import axios from 'axios'
import {useDispatch} from 'react-redux';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert'

const Register = ({SelectedPlan,setCname}) => {
    const [plan,setPlan] = useState({});
    const [country,setCountry] = useState('');
    const [timezone,setTimezone] = useState('');
    const [name,setName] = useState('');
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [station_name,setStation_name] = useState('');
    const [website_url,setWebsite_url] = useState('');
    const [loading,setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
       const selectPlanData =  plansData.find(({name}) => name === SelectedPlan);
       setPlan(selectPlanData);
    },[SelectedPlan])

    

    useEffect(() => {
        (
            async function(){
                
                let res = await fetch('https://ipapi.co/json');
                res = await res.json();
                if(res.country_name){
                    setCountry(res.country_name);
                    setTimezone(res.timezone)
                }
            }
        )()
    },[]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try{
            const {data} = await axios.post('/api/v1/register',{name,email,password,country,station_name,website_url,timezone});
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            if(data.success) setCname('checkout')
        }catch(error){
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
            console.log(error.message)
        }
        setLoading(true);
    }
  return (
    <section className='login-section min-h-screen section'>
        <div className='container m-auto min-h-full flex justify-center items-center'>
        <div className='form-outer-box max-w-[40rem] w-[40rem] shadow-xl rounded-md p-2 py-4 border border-gray-100'>
                <div className='px-5 py-4 flex justify-between items-center'>
                    <button type='button' onClick={() => setCname('plans')}>
                        <FaArrowLeft/>
                    </button>
                    <Image src="/images/logo.svg" width={200} height={300} className='w-28'/>
                    <span></span>
                </div>
                <form className='p-3 px-6' onSubmit={handleSubmit}>
                <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="name" className='text-black text-lg'>Name</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <AiOutlineUser size={20} className='text-gray-400'/>
                            <input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your name' id='name' name='name' required/>
                        </div>
                    </div>
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

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="country" className='text-black text-lg'>Country</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <FaEarthAsia size={20} className='text-gray-400'/>
                            <select className='w-[95%] outline-none ml-1' id='country' value={country} onChange={(e) => setCountry(e.target.value)} name='country' required>
                                {
                                    getNames().map((name) => <option value={name}>{name}</option>)
                                }
                                
                            </select>
                        </div>   
                    </div>

                    <div className='input-group flex justify-center items-center gap-1 mb-6'>
                        <h2 className='sub-heading text-black'>Tell us about your station.</h2>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="station_name" className='text-black text-lg'>Station Name</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <FaRadio size={20} className='text-gray-400 mb-[7.5px]'/>
                            <input type='text' value={station_name} onChange={(e) => setStation_name(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your station name' id='station_name' name='station_name' required/>
                        </div>   
                    </div>
                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="website_url" className='text-black text-lg'>Website URL</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <CgWebsite size={20} className='text-gray-400'/>
                            <input type='text' value={website_url} onChange={(e) => setWebsite_url(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your website url (optional)' id='website_url' name='website_url'/>
                        </div>   
                    </div>
                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="time_zone" className='text-black text-lg'>Time Zone</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <FaClock size={20} className='text-gray-400'/>
                            <select className='w-[95%] outline-none ml-1' id='time_zone' name='time_zone' required value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                                {
                                    timezones.map(({tzCode,label}) => <option value={tzCode}>{label}</option>)
                                }        
                            </select>
                        </div>   
                    </div>


                    {
                        plan != {} && <div className='flex justify-center items-center flex-col gap-2 py-5'>
                            <h2 className='sub-heading'>Selected Plan</h2>
                            <div className='w-[80%]'>
                                <PlanCard {...plan} hidebtn={true}/>
                            </div>
                        </div>
                    }

                    <div className='input-group flex items-center justify-between mb-6'>
                        <p className='text-lg text-black'>If you {`already`} have account <Link className='text-indigo-500 hover:underline' href={'/login'}>Sign In</Link></p>  
                    </div>
                    
                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>Sign Up</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
  )
}

export default Register