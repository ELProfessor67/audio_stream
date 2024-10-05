"use client";
import React, { useState } from 'react'
import Image from 'next/image'
import {MdAlternateEmail,MdAudiotrack,MdKey} from 'react-icons/md'
import Link from 'next/link'
import {MdOutlineSubtitles,MdDescription, MdPhoto} from 'react-icons/md';
import {FaUserAlt} from 'react-icons/fa';
import axios from 'axios';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';


const page = () => {
    const [title,setTitle] = useState('');
    
    const [audiofile,setAudio] = useState('');
    
    
    const [size,setSize] = useState('');
    const [type,setType] = useState('');
    const [audioEx,setAudioEx] = useState('');
    const [loading,setLoading] = useState(false);
    const [duration,setDuration] = useState(0);
    const dispatch = useDispatch();
 


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try{
            const {data} = await axios.post('/api/v1/ads',{audioEx,title,size,type,audio: audiofile,duration});
            setTitle('');
            
            
            e.target.reset();
            setAudio('');
            
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
        }catch(error){
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
        }
        setLoading(false);

    }

    const fileToBase64 = (e,setState,setEx) => {
        const [file] = e.target.files;

        const reader = new FileReader();

        reader.onload = function(){
            if(reader.readyState == 2){
                const base64String = reader.result;
                setSize(file.size);
                setType(file.type);
                setState(base64String);
                const extention = file.name.split('.').reverse()[0]
                setEx(extention);
                const audio = new Audio(base64String);
                audio.addEventListener('loadedmetadata',function(){
                    // console.log('duration',audio.duration);
                    setDuration(audio.duration);
                })
            }
        }

        reader.readAsDataURL(file);
    }

  return (
    <section className='w-full py-5 px-4'>
        <div className='flex justify-start items-center h-full flex-col'>
            <h1 className='main-heading mb-10'>Add Ads</h1>
            <div className='w-[40rem] max-w-[40rem] border border-x-gray-100 shadow-md p-3 rounded-md mb-6'>
                <form className='p-3 px-6' onSubmit={handleSubmit}>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="title" className='text-black text-lg'>Title</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdOutlineSubtitles size={20} className='text-gray-400'/>
                            <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your title' id='title' name='title' required/>
                        </div>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="audio" className='text-black text-lg'>Audio File</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdAudiotrack size={20} className='text-gray-400'/>
                            <input type='file' onChange={(e) => fileToBase64(e,setAudio,setAudioEx)} className='w-[95%] outline-none ml-1' id='audio' name='audio' accept="audio/*" required/>
                        </div>   
                    </div>

                    {
                        audiofile && <div className="mb-6">
                            <audio controls src={audiofile} className="w-full"></audio>
                        </div>
                    }
                    

                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Upload' : 'Loading...'}</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
  )
}

export default page