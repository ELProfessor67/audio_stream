"use client";
import React, { useState,useEffect,useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {MdOutlineSubtitles,MdDescription,MdPlaylistAdd} from 'react-icons/md';
import {FaUserAlt} from 'react-icons/fa';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';

export default function Page(){
	const [title,setTitle] = useState('');
    const [description,setDescription] = useState('description');
    const [seletdSongs,setSelectedSongs] = useState([]);
    const [songs,setSongs] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading,setLoading] = useState(false);
    const dispatch = useDispatch();
    // console.log(seletdSongs)

    const handleSubmit = async (e) => {
        if(e.preventDefault){
            e.preventDefault();
        }
        setOpen(false);
        setLoading(true);
        try{
            if(!title || !description) return
            if(seletdSongs.length === 0) return window.alert('please select atleast one songs');
            const {data} = await axios.post('/api/v1/playlist',{title,description,songs: seletdSongs});
            setTitle('');
            setSelectedSongs([]);
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());

            // window.alert(data.message)
        }catch(err){
            await dispatch(showError(err.response.data.message));
            await dispatch(clearError());
            console.log(err.message);
        }
        setLoading(false);

    }


    const handleCheckbox = (_id) => {
        setSelectedSongs(prev => {
            if(prev.includes(_id)){
                return prev.filter(id => _id != id);
            }else{
                return [...prev,_id]
            }
        })
    }

    useEffect(() => {
	    (
	      async function(){
	        try{
	          const {data} = await axios.get('/api/v1/song');
	          setSongs(data?.songs);
	        }catch(err){
	          console.log(err.response.data.message);
	        }
	      }
	    )()
	  },[]);

    
	return(
		<>
			<section className='w-full py-5 px-4'>
        <div className='flex justify-start items-center h-full flex-col'>
            <h1 className='main-heading mb-10'>Create Playlist</h1>
            <div className='w-[40rem] max-w-[40rem] border border-x-gray-100 shadow-md p-3 rounded-md mb-6'>
                <form className='p-3 px-6' onSubmit={handleSubmit}>

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="title" className='text-black text-lg'>Title</label>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdOutlineSubtitles size={20} className='text-gray-400'/>
                            <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your title' id='title' name='title' required/>
                        </div>
                    </div>

                    {/*<div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="description" className='text-black text-lg'>Description</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdDescription size={20} className='text-gray-400'/>
                            <input type='text' value={description} onChange={(e) => setDescription(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your description' id='description' name='description' required/>
                        </div>   
                    </div>*/}

                    <div className='input-group flex flex-col gap-1 mb-6'>
                        <label for="description" className='text-black text-lg'>Select Songs</label>
                        <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <MdPlaylistAdd size={20} className='text-gray-400'/>
                            <button type="button" className="w-full h-full text-gray-400 text-left bg-none border-none outline-none px-1" onClick={() => setOpen(true)}>
                            	{seletdSongs.length === 0 ? "Select Song" : `${seletdSongs.length} song seleted`}
                            </button>
                        </div>   
                    </div>                 

                    <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Create' : 'Loading...'}</button>
                    </div>
                </form>
            </div>
        </div>
        <Dialog open={open} onClose={() => setOpen(false)} seletdSongs={seletdSongs} save={handleSubmit}>
        	{
        		songs && songs.map((data) => (
        			<div className="flex justify-between items-center my-6">
        				<div className="flex items-center gap-4">
                            <Image src={data.cover} width={200} height={200} alt="cover" className="h-[6rem] w-28 object-conver rounded"/> 
                            <h2 className="text-xl text-black">{data?.title}</h2>           
                        </div>

                        <div className="mr-10">
                            <input type="checkbox" className="p-4" checked={seletdSongs.includes(data._id)} onChange={() => handleCheckbox(data._id)}/>
                        </div>
        			</div>
        		))
        	}
        </Dialog>
    </section>
		</>
	);
}