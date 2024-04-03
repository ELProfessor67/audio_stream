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
    const [description,setDescription] = useState('hhh');
    const [audiofile,setAudio] = useState('');
    const [cover,setCover] = useState('/upload/cover/default.jpg');
    const [artist,setArtist] = useState('unknown');
    const [size,setSize] = useState('');
    const [type,setType] = useState('');
    const [audioEx,setAudioEx] = useState('');
    const [coverEx,setCoverEx] = useState('');
    const [loading,setLoading] = useState(false);
    const [duration,setDuration] = useState(0);
    const dispatch = useDispatch();
    const [album,setAlbum] = useState('');
    const [loadPerc,setLoadPerc] = useState(0);


    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log('submit',{title,description,artist,size,type,audiofile,cover})
        setLoading(true);
        try{
            const {data} = await axios.post('/api/v1/song',{audioEx,coverEx,title,description,artist,size,type,cover,audio: audiofile,duration,album},{
                onUploadProgress: (ProgressEvent) => {
                    const progress = Math.round((ProgressEvent.loaded * 100) / ProgressEvent.total);
                    if(progress > 7){

                        setLoadPerc(progress-7);
                    }else{
                        setLoadPerc(progress);
                    }
                }
            });
            setLoadPerc(100);
            setTitle('');
            setDescription('');
            setArtist('');
            e.target.reset();
            setAudio('');
            setCover('');
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            // console.log(data)
        }catch(error){
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
        }
        setLoadPerc(0);
        setLoading(false);

    }

    const fileToBase64 = (e,setState,setEx) => {
        const [file] = e.target.files;

        const reader = new FileReader();
        if(!title){
            setTitle(file.name.split('.')[0]);
        }

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
            <h1 className='main-heading mb-10'>Upload Songs</h1>
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
                        <label for="album" className='text-black text-lg'>Album</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdDescription size={20} className='text-gray-400'/>
                            <input type='text' value={album} onChange={(e) => setAlbum(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter album name' id='album' name='album' required/>
                        </div>   
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="artist" className='text-black text-lg'>Artist Name</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <FaUserAlt size={20} className='text-gray-400'/>
                            <input type='text' value={artist} onChange={(e) => setArtist(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your artist' id='artist' name='artist' required/>
                        </div>   
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="cover" className='text-black text-lg'>Cover Photo</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdPhoto size={20} className='text-gray-400'/>
                            <input type='file' onChange={(e) => fileToBase64(e,setCover,setCoverEx)}  className='w-[95%] outline-none ml-1'  id='cover' name='cover' accept="image/*"/>
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

                    {
                        cover && <div className="mb-6 flex justify-center items-center">
                            <img src={cover} className="w-[8rem] rounded" alt="select cover photo"/>
                        </div>
                    }
                    

                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Upload' : `${loadPerc}%`}</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
  )
}

export default page