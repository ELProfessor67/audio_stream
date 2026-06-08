"use client";
import React, { useRef, useEffect, useState } from 'react'
import { MdOutlineSubtitles } from 'react-icons/md';
import { FaLock, FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch } from 'react-redux';
import { BsCalendarDate, BsClock, BsMailbox, BsPhone } from 'react-icons/bs';
import { FaAccessibleIcon } from 'react-icons/fa6';
import timezones from 'timezones-list';
import { MultiSelect } from "react-multi-select-component";
import Select from "react-select";
import { MdCameraAlt } from 'react-icons/md';

function convertToUTC(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const localDate = new Date();
    localDate.setHours(hours);
    localDate.setMinutes(minutes);
    const localOffsetMinutes = localDate.getTimezoneOffset();
    const utcTimestamp = localDate.getTime() + (localOffsetMinutes * 60000);
    const utcDate = new Date(utcTimestamp);
    const utcHours = utcDate.getHours().toString().padStart(2, '0');
    const utcMinutes = utcDate.getMinutes().toString().padStart(2, '0');
    return `${utcHours}:${utcMinutes}`;
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

    // ---- Profile Picture State ----
    const [profilePicPreview, setProfilePicPreview] = useState(null);  // blob URL for preview
    const [profilePicBase64, setProfilePicBase64] = useState(null);    // base64 string to send
    const [profilePicExt, setProfilePicExt] = useState(null);          // file extension
    const profilePicInputRef = useRef(null);

    const permissions = ['songs', 'playlists', 'schedules', 'live', 'dashboard', 'requests', 'ads', 'add_song'];
    const dispatch = useDispatch();

    // Handle profile picture file selection — compress via canvas before base64
    const handleProfilePicChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately (uncompressed blob is fine for preview)
        const previewUrl = URL.createObjectURL(file);
        setProfilePicPreview(previewUrl);
        setProfilePicExt('jpeg'); // always output as jpeg after compression

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                // Resize to max 400×400 keeping aspect ratio
                const MAX = 400;
                let { width, height } = img;
                if (width > height) {
                    if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
                } else {
                    if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export as JPEG at 80% quality → much smaller payload
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                setProfilePicBase64(compressedBase64);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (profilePicPreview) URL.revokeObjectURL(profilePicPreview);
        };
    }, [profilePicPreview]);

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
        if (e) e.preventDefault();
        setLoading(true);
        try {
            let djDays = [];
            selectedDays.forEach((data) => djDays.push(data.value));

            const payload = {
                name, email, password,
                permissions: selectPermission,
                starttime: starttime ? convertToUTC(starttime) : undefined,
                endtime: endtime ? convertToUTC(endtime) : undefined,
                djDate,
                djTimeInDays: timeInDays,
                djDays,
                rawTime: `${starttime || ''}|${endtime || ''}`,
                timezone,
                phone,
                profilePicBase64: profilePicBase64 || undefined,
                profilePicExt: profilePicExt || undefined,
            };

            const { data } = await axios.post('/api/v1/dj', payload);
            setName('');
            setEmail('');
            setPassword('');
            setSelectedPermission([]);
            setStarttime('');
            setEndtime('');
            setProfilePicPreview(null);
            setProfilePicBase64(null);
            setProfilePicExt(null);
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            // If the profile picture upload was skipped, warn the user
            if (data.warning) {
                await dispatch(showError(data.warning));
                await dispatch(clearError());
            }
        } catch (error) {
            console.log(error.message);
            await dispatch(showError(error.response?.data?.message || error.message));
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

                        {/* ---- Profile Picture Upload ---- */}
                        <div className='flex flex-col items-center gap-3 mb-8'>
                            <div
                                className='relative w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-300 cursor-pointer group shadow-md hover:shadow-indigo-200 transition-all'
                                onClick={() => profilePicInputRef.current?.click()}
                                title="Click to upload profile picture"
                            >
                                {profilePicPreview ? (
                                    <img
                                        src={profilePicPreview}
                                        alt="DJ Profile"
                                        className='w-full h-full object-cover'
                                    />
                                ) : (
                                    <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                                        <FaUserCircle size={60} className='text-gray-300' />
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className='absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                    <MdCameraAlt size={24} className='text-white' />
                                    <span className='text-white text-xs mt-1 font-medium'>Change</span>
                                </div>
                            </div>
                            <p className='text-gray-400 text-sm'>Click to upload profile picture</p>
                            <input
                                ref={profilePicInputRef}
                                type='file'
                                accept='image/*'
                                className='hidden'
                                onChange={handleProfilePicChange}
                                id='profilePic'
                            />
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="name" className='text-black text-lg'>Name</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                <MdOutlineSubtitles size={20} className='text-gray-400' />
                                <input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj name' id='name' name='name' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="email" className='text-black text-lg'>Email</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                <BsMailbox size={20} className='text-gray-400' />
                                <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj email' id='email' name='email' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="phone" className='text-black text-lg'>Phone</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                <BsPhone size={20} className='text-gray-400' />
                                <input type='tel' value={phone} onChange={(e) => setPhone(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj phone number' id='phone' name='phone' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="password" className='text-black text-lg'>Password</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                <FaLock size={20} className='text-gray-400' />
                                <input type='text' value={password} onChange={(e) => setPassword(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj password' id='password' name='password' required />
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label htmlFor="permissions" className='text-black text-lg'>Permissions</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
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
                                    <div className="checkbox-wrapper-12">
                                        <div className="cbx">
                                            <input id="cbx-12" type="checkbox" checked={timeInDays} onChange={() => setTimeInDays(prev => !prev)} />
                                            <label htmlFor="cbx-12"></label>
                                            <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                                                <path d="M2 8.36364L6.23077 12L13 2"></path>
                                            </svg>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
                                            <defs>
                                                <filter id="goo-12">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"></feGaussianBlur>
                                                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" result="goo-12"></feColorMatrix>
                                                    <feBlend in="SourceGraphic" in2="goo-12"></feBlend>
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
                                                <label htmlFor="liveDays" className='text-black text-lg'>Live Days</label>
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
                                                <label htmlFor="liveDate" className='text-black text-lg'>Live Date</label>
                                                <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                                    <BsCalendarDate size={20} className='text-gray-400' />
                                                    <input type='date' value={djDate} onChange={(e) => setdjDate(e.target.value)} className='w-[95%] outline-none ml-1' id='liveDate' name='liveDate' required />
                                                </div>
                                            </div>
                                        </>
                                }

                                <div className='input-group flex flex-col gap-1 mb-6'>
                                    <label htmlFor="timezone" className='text-black text-lg'>DJ Timezone</label>
                                    <Select
                                        options={timezones}
                                        getOptionLabel={(e) => `${e.label}`}
                                        getOptionValue={(e) => e.tzCode}
                                        onChange={(value) => setTimezone(value.tzCode)}
                                        placeholder="Select Timezone..."
                                        isSearchable={true}
                                        className='w-full border-none py-3'
                                        inputId="timezone"
                                    />
                                </div>

                                <div className='input-group flex flex-col gap-1 mb-6'>
                                    <label htmlFor="starttime" className='text-black text-lg'>Live Start Time</label>
                                    <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                        <BsClock size={20} className='text-gray-400' />
                                        <input type='time' value={starttime} onChange={(e) => setStarttime(e.target.value)} className='w-[95%] outline-none ml-1' id='starttime' name='starttime' required />
                                    </div>
                                </div>

                                <div className='input-group flex flex-col gap-1 mb-6'>
                                    <label htmlFor="endtime" className='text-black text-lg'>Live End Time</label>
                                    <div className='flex items-center relative py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                                        <BsClock size={20} className='text-gray-400' />
                                        <input type='time' value={endtime} onChange={(e) => setEndtime(e.target.value)} className='w-[95%] outline-none ml-1' id='endtime' name='endtime' required />
                                    </div>
                                </div>
            
                            </>
                        }

                        <div className='flex justify-center items-center'>
                            <button
                                type='submit'
                                disabled={loading}
                                className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed'
                            >
                                {!loading ? 'Add DJ' : 'Uploading...'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Dialog open={open} onClose={() => setOpen(false)} bottomSave={handlebottomSave}>
                {
                    permissions && permissions.map((permission) => (
                        <div key={permission} className="flex justify-between items-center my-6">
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