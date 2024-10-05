import React, { useEffect, useState } from 'react'
import Dialog from './Dialog'
import { useDispatch } from 'react-redux';
import { MdOutlineSubtitles, MdPlaylistAdd } from 'react-icons/md';
import Image from 'next/image';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import axios from 'axios';

const RenamePlaylistComponents = ({createPlaylistOpen,setCreatePlaylistOpen, allsongs,getPlaylist,_id,title:ptitle}) => {
    const [title,setTitle] = useState(ptitle);
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
            // if(seletdSongs.length === 0) return window.alert('please select atleast one songs');
            const {data} = await axios.post(`/api/v1/playlist/${_id}`,{title});
            setTitle('');
            
            getPlaylist();
            await dispatch(showMessage("Rename successfully"));
            await dispatch(clearMessage());
            setCreatePlaylistOpen(false);


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

    useEffect(() => {
        setTitle(ptitle)
    },[ptitle])
    return (
        <>
            <Dialog open={createPlaylistOpen} onClose={() => setCreatePlaylistOpen(false)} >
                <div className='flex justify-start items-center h-full flex-col'>
                    <h1 className='main-heading mb-10'>Rename Playlist</h1>
                    <div className='w-full max-w-[100%]'>
                        <form className='p-3 px-6' onSubmit={handleSubmit}>

                            <div className='input-group flex flex-col gap-1 mb-6'>
                                <label for="title" className='text-black text-lg'>Title</label>
                                <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <MdOutlineSubtitles size={20} className='text-gray-400' />
                                    <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your title' id='title' name='title' required />
                                </div>
                            </div>

                            <div className='flex justify-center items-center'>
                                <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Update' : 'Loading...'}</button>
                            </div>
                        </form>
                        </div>
                    </div>
                
            </Dialog>
        </>
    )
}

export default  RenamePlaylistComponents
