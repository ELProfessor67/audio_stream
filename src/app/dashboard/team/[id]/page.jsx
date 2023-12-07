"use client";
import React, { useState,useEffect } from 'react'
import Image from 'next/image'
import {MdAlternateEmail,MdAudiotrack,MdKey} from 'react-icons/md'
import Link from 'next/link'
import {MdOutlineSubtitles,MdDescription, MdPhoto} from 'react-icons/md';
import {FaUserAlt} from 'react-icons/fa';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';


const page = ({params}) => {
    const [name,setName] = useState('');
    const [email,setEmail] = useState('');
    const [open,setOpen] = useState(false);
    const [selectPermission,setSelectedPermission] = useState([]);
    const [starttime,setStarttime] = useState();
    const [endtime,setEndtime] = useState();
    const [loading, setLoading] = useState(false);

    const permissions = ['songs','playlists','schedules','live','dashboard','requests','ads'];
    const dispatch = useDispatch();

    const handleCheckbox = (permission) => {
     setSelectedPermission(prev => {
     	if(prev.includes(permission)){
     		return prev.filter(ele => ele != permission);
     	}else{
     		return [...prev,permission]
     	}
     })
    }



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
 
        try{
            const {data} = await axios.put(`/api/v1/dj/${params.id}`,{name,email,permissions: selectPermission,starttime,endtime});
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            console.log(data)
        }catch(error){
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
            console.log(error.response.data.message);
        }
        setLoading(false);
    }

    useEffect(() => {
        (async function(){
            try{
                const {data} = await axios.get(`/api/v1/dj/${params.id}`);
                setName(data?.team.name);
                setEmail(data?.team?.email);
                setSelectedPermission(data?.team.djPermissions);
                setStarttime(data?.team.djStartTime);
                setEndtime(data?.team.djEndTime);
            }catch(err){
                console.log(err.response.data.message);
            }
        })();
    },[params.id])

  return (
    <section className='w-full py-5 px-4'>
        <div className='flex justify-start items-center h-full flex-col'>
            <h1 className='main-heading mb-10'>Create Team</h1>
            <div className='w-[40rem] max-w-[40rem] border border-x-gray-100 shadow-md p-3 rounded-md mb-6'>
                <form className='p-3 px-6' onSubmit={handleSubmit}>

                	<div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="name" className='text-black text-lg'>Name</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdOutlineSubtitles size={20} className='text-gray-400'/>
                            <input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj name' id='name' name='name' required/>
                        </div>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="email" className='text-black text-lg'>Email</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdOutlineSubtitles size={20} className='text-gray-400'/>
                            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter dj email' id='email' name='email' required/>
                        </div>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="permissions" className='text-black text-lg'>Permissions</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <FaUserAlt size={20} className='text-gray-400'/>
                            <button type="button" className="w-full h-full text-gray-400 text-left bg-none border-none outline-none px-1" onClick={() => setOpen(true)}>
                            	 {
                            	 	selectPermission.length != 0
                            	 	? selectPermission.map((p,i) => `${i == 0 ? '' : ', '} ${p}`)
                            	 	: 'select permission'
                            	 }
                            </button>
                        </div>   
                    </div>

                    {
                        selectPermission.includes('live') &&
                        <>
                            <div className='input-group flex flex-col gap-1 mb-6'>
                                <label for="starttime" className='text-black text-lg'>Live Start Time</label>
                                <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <FaUserAlt size={20} className='text-gray-400'/>
                                    <input type='time' value={starttime} onChange={(e) => setStarttime(e.target.value)} className='w-[95%] outline-none ml-1' id='starttime' name='starttime' required/>
                                </div>   
                            </div>

                            <div className='input-group flex flex-col gap-1 mb-6'>
                                <label for="endtime" className='text-black text-lg'>Live End Time</label>
                                <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <FaUserAlt size={20} className='text-gray-400'/>
                                    <input type='time' value={endtime} onChange={(e) => setEndtime(e.target.value)} className='w-[95%] outline-none ml-1' id='endtime' name='endtime' required/>
                                </div>   
                            </div>
                        </>
                    }

                    
                    

                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Update' : 'Loading...'}</button>
                    </div>
                </form>
            </div>
        </div>

        <Dialog open={open} onClose={() => setOpen(false)}>
        	{
        		permissions && permissions.map((permission) => (
        			<div className="flex justify-between items-center my-6">
        				<div className="flex items-center gap-4">
                        
                            <h2 className="text-xl text-black">{permission}</h2>           
                        </div>

                        <div className="mr-10">
                            <input type="checkbox" className="p-4" checked={selectPermission.includes(permission)} onChange={() => handleCheckbox(permission)}/>
                        </div>
        			</div>
        		))
        	}
        </Dialog>
    </section>
  )
}

export default page