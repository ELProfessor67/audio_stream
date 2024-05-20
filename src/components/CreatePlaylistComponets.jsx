import React, { useState } from 'react'
import Dialog from './Dialog'
import { useDispatch } from 'react-redux';
import { MdOutlineSubtitles, MdPlaylistAdd } from 'react-icons/md';
import Image from 'next/image';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import axios from 'axios';

const CreatePlaylistComponets = ({createPlaylistOpen,setCreatePlaylistOpen, allsongs,getPlaylist}) => {
    const [title,setTitle] = useState('');
    const [description,setDescription] = useState('description');
    const [seletdSongs,setSelectedSongs] = useState([]);
    const [loading,setLoading] = useState(false);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
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
            setCreatePlaylistOpen(false);
            getPlaylist();


            // window.alert(data.message)
        }catch(err){
            await dispatch(showError(error.response.data.message));
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
    return (
        <>
            <Dialog open={createPlaylistOpen} onClose={() => setCreatePlaylistOpen(false)} >
                <div className='flex justify-start items-center h-full flex-col'>
                    <h1 className='main-heading mb-10'>Create Playlist</h1>
                    <div className='w-full max-w-[100%]'>
                        <form className='p-3 px-6' onSubmit={handleSubmit}>

                            <div className='input-group flex flex-col gap-1 mb-6'>
                                <label for="title" className='text-black text-lg'>Title</label>
                                <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <MdOutlineSubtitles size={20} className='text-gray-400' />
                                    <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your title' id='title' name='title' required />
                                </div>
                            </div>

                            

                            <div className='input-group flex flex-col gap-1 mb-6'>
                                <label for="description" className='text-black text-lg'>Select Songs</label>
                                <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <MdPlaylistAdd size={20} className='text-gray-400' />
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
                
            </Dialog>

            <Dialog open={open} onClose={() => setOpen(false)} seletdSongs={seletdSongs} save={handleSubmit}>
        	{
        		allsongs && allsongs.map((data) => (
        			<div className="flex justify-between items-center my-6">
        				<div className="flex items-center gap-4">
                            <Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded"/> 
                            <h2 className="text-xl text-black">{data?.title}</h2>           
                        </div>

                        <div className="mr-10">
                            <input type="checkbox" className="p-4" checked={seletdSongs.includes(data._id)} onChange={() => handleCheckbox(data._id)}/>
                        </div>
        			</div>
        		))
        	}
        </Dialog>
        </>
    )
}

export default CreatePlaylistComponets