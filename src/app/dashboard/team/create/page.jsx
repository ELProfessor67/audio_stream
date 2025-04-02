"use client";
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { MdAlternateEmail, MdAudiotrack, MdKey } from 'react-icons/md'
import Link from 'next/link'
import { MdOutlineSubtitles, MdDescription, MdPhoto } from 'react-icons/md';
import { FaUserAlt } from 'react-icons/fa';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch } from 'react-redux';
import { BsCalendarDate, BsClock, BsMailbox, BsPhone } from 'react-icons/bs';
import { FaAccessibleIcon, FaLock } from 'react-icons/fa6';
import timezones from 'timezones-list';
import { MultiSelect } from "react-multi-select-component";
import { toast } from 'react-toastify';
import Select from "react-select";
import { CgTime } from 'react-icons/cg';

function convertToUTC(timeString) {
    // Split timeString into hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a new Date object with today's date and the input time in local time
    const localDate = new Date();
    localDate.setHours(hours);
    localDate.setMinutes(minutes);

    const localOffsetMinutes = localDate.getTimezoneOffset();

    // Convert local time to UTC
    const utcTimestamp = localDate.getTime() + (localOffsetMinutes * 60000); // Convert minutes to milliseconds
    const utcDate = new Date(utcTimestamp);

    // Format UTC time as 'HH:mm' string
    const utcHours = utcDate.getHours().toString().padStart(2, '0');
    const utcMinutes = utcDate.getMinutes().toString().padStart(2, '0');
    const utcTimeString = `${utcHours}:${utcMinutes}`;
    return utcTimeString;
}


const options = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 }
];


const page = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [selectPermission, setSelectedPermission] = useState(['songs', 'schedules', 'live', 'dashboard', 'requests', 'ads', 'add_song']);
    const [starttime, setStarttime] = useState();
    const [endtime, setEndtime] = useState();
    const [djDate, setdjDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeInDays, setTimeInDays] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [timezone, setTimezone] = useState("America/New_York");
    const [phone, setPhone] = useState("");



 
    

    const permissions = ['songs', 'playlists', 'schedules', 'live', 'dashboard', 'requests', 'ads', 'add_song'];
    const dispatch = useDispatch();

    const handleCheckbox = (permission) => {
        setSelectedPermission(prev => {
            if (prev.includes(permission)) {
                return prev.filter(ele => ele != permission);
            } else {
                return [...prev, permission]
            }
        })
    }



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let djDays = [];
            selectedDays.forEach((data) => djDays.push(data.value));
            const { data } = await axios.post('/api/v1/dj', { name, email, password, permissions: selectPermission, starttime: convertToUTC(starttime), endtime: convertToUTC(endtime), djDate, djTimeInDays: timeInDays, djDays, rawTime: `${starttime}|${endtime}`,timezone,phone });
            setName('');
            setEmail('');
            setPassword('');
            setSelectedPermission([]);
            setStarttime('');
            setEndtime('');
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());

         
        } catch (error) {
            console.log(error.message)
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
        }
        setLoading(false);

    }

    const handlebottomSave = () => {
        handleSubmit(undefined);
    }

    return (
        <section className='w-full py-5 px-4'>
            <div className='flex justify-start items-center h-full flex-col'>
                <h1 className='main-heading mb-10'>Create DJ</h1>
                <div className='w-[40rem] max-w-[40rem] border border-x-gray-100 shadow-md p-3 rounded-md mb-6'>
                    <form className='p-3 px-6' onSubmit={handleSubmit}>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="name" className='text-black text-lg'>Name</label>
                            <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <MdOutlineSubtitles size={20} className='text-gray-400' />
                                <input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj name' id='name' name='name' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="email" className='text-black text-lg'>Email</label>
                            <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <BsMailbox size={20} className='text-gray-400' />
                                <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj email' id='email' name='email' required />
                            </div>
                        </div>
                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="phone" className='text-black text-lg'>Phone</label>
                            <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <BsPhone size={20} className='text-gray-400' />
                                <input type='phone' value={phone} onChange={(e) => setPhone(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj phone number' id='phone' name='phone' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="password" className='text-black text-lg'>Password</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <FaLock size={20} className='text-gray-400' />
                                <input type='text' value={password} onChange={(e) => setPassword(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj password' id='password' name='password' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="permissions" className='text-black text-lg'>Permissions</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <FaAccessibleIcon size={20} className='text-gray-400' />
                                <button type="button" className="w-full h-full text-gray-400 text-left bg-none border-none outline-none px-1" onClick={() => setOpen(true)}>
                                    {
                                        selectPermission.length != 0
                                            ? selectPermission.map((p, i) => `${i == 0 ? '' : ', '} ${p}`)
                                            : 'select permission'
                                    }
                                </button>
                            </div>
                        </div>

                        {
                            selectPermission.includes('live') &&
                            <>
                                <div className='input-group items-center flex flex-row gap-1 mb-6'>
                                    {/* <div class="checkbox-wrapper-61">
                                        <input type="checkbox" class="check" id="check1-61" checked={timeInDays} onChange={() => setTimeInDays(prev => !prev)} />
                                        <label for="check1-61" class="label">
                                            <svg width="35" height="35" viewbox="0 0 95 95" >
                                                <rect x="30" y="30" width="40" height="40" stroke="black" fill="none" />
                                                <g transform="translate(0,-952.36222)">
                                                    <path d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4 " stroke="black" stroke-width="3" fill="none" class="path1" />
                                                </g>
                                            </svg>
                                        </label>
                                    </div> */}
                                    <div class="checkbox-wrapper-12">
                                        <div class="cbx">
                                            <input id="cbx-12" type="checkbox" checked={timeInDays} onChange={() => setTimeInDays(prev => !prev)} />
                                            <label for="cbx-12"></label>
                                            <svg width="15" height="14" viewbox="0 0 15 14" fill="none">
                                                <path d="M2 8.36364L6.23077 12L13 2"></path>
                                            </svg>
                                        </div>

                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                                            <defs>
                                                <filter id="goo-12">
                                                    <fegaussianblur in="SourceGraphic" stddeviation="4" result="blur"></fegaussianblur>
                                                    <fecolormatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" result="goo-12"></fecolormatrix>
                                                    <feblend in="SourceGraphic" in2="goo-12"></feblend>
                                                </filter>
                                            </defs>
                                        </svg>
                                    </div>
                                    <p className='text-gray-700 ml-2'>Given Time in Days/Date ?</p>
                                </div>
                                {
                                    timeInDays ?
                                        (<>
                                            <div className='input-group flex flex-col gap-1 mb-6'>
                                                <label for="endtime" className='text-black text-lg'>Live Days</label>

                                                <MultiSelect
                                                    options={options}
                                                    value={selectedDays}
                                                    onChange={setSelectedDays}
                                                    labelledBy="Select"
                                                    className='w-[95%] outline-none ml-1'
                                                />

                                            </div>
                                        </>)
                                        : <>
                                            <div className='input-group flex flex-col gap-1 mb-6'>
                                                <label for="endtime" className='text-black text-lg'>Live Date</label>
                                                <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                                    <BsCalendarDate size={20} className='text-gray-400' />
                                                    <input type='date' value={djDate} onChange={(e) => setdjDate(e.target.value)} className='w-[95%] outline-none ml-1' id='endtime' name='endtime' required />
                                                </div>
                                            </div>


                                        </>
                                }


                                <div className='input-group flex flex-col gap-1 mb-6'>
                                    <label for="starttime" className='text-black text-lg'>DJ Timezone</label>
                                       
                                        <Select
                                            options={timezones}
                                            getOptionLabel={(e) => `${e.label}`}
                                            getOptionValue={(e) => e.tzCode} 
                                            onChange={(value) => setTimezone(value.tzCode)}
                                            placeholder="Select Timezone..."
                                            isSearchable={true}
                                            className='w-full border-none py-3'

                                        />
                                </div>


                                <div className='input-group flex flex-col gap-1 mb-6'>
                                    <label for="starttime" className='text-black text-lg'>Live Start Time</label>
                                    <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                        <BsClock size={20} className='text-gray-400' />
                                        <input type='time' value={starttime} onChange={(e) => setStarttime(e.target.value)} className='w-[95%] outline-none ml-1' id='starttime' name='starttime' required />
                                    </div>
                                </div>

                                <div className='input-group flex flex-col gap-1 mb-6'>
                                    <label for="endtime" className='text-black text-lg'>Live End Time</label>
                                    <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                        <BsClock size={20} className='text-gray-400' />
                                        <input type='time' value={endtime} onChange={(e) => setEndtime(e.target.value)} className='w-[95%] outline-none ml-1' id='endtime' name='endtime' required />
                                    </div>
                                </div>

                            </>
                        }




                        <div className='flex justify-center items-center'>
                            <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Add' : 'Loading...'}</button>
                        </div>
                    </form>
                </div>
            </div>

            <Dialog open={open} onClose={() => setOpen(false)} bottomSave={handlebottomSave}>
                {
                    permissions && permissions.map((permission) => (
                        <div className="flex justify-between items-center my-6">
                            <div className="flex items-center gap-4">

                                <h2 className="text-xl text-black">{permission == 'playlists' ? 'admin playlists' : permission}</h2>
                            </div>

                            <div className="mr-10">
                                <input type="checkbox" className="p-4" checked={selectPermission.includes(permission)} onChange={() => handleCheckbox(permission)} />
                            </div>
                        </div>
                    ))
                }
            </Dialog>
        </section>
    )
}

export default page