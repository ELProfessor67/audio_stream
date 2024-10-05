import React, { useEffect, useState } from 'react'
import Dialog from './Dialog'
import { useDispatch } from 'react-redux';
import { MdOutlineSubtitles, MdPlaylistAdd } from 'react-icons/md';
import Image from 'next/image';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import axios from 'axios';

const EditPlaylistComponets = ({createPlaylistOpen,setCreatePlaylistOpen, allplaylists,getPlaylist,_id,allsongs}) => {
    const [seletdSongs,setSelectedSongs] = useState([]);
    const [loading,setLoading] = useState(false);
    const dispatch = useDispatch();
    // console.log(seletdSongs)

    const handleSubmit = async (e) => {
        if(e.preventDefault){
            e.preventDefault();
        }
        
        setLoading(true);
        try{
           
            if(seletdSongs.length === 0) return window.alert('please select atleast one songs');
            
            const {data} = await axios.post(`/api/v1/playlist/${_id}`,{songs: seletdSongs});
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            setCreatePlaylistOpen(false);
            getPlaylist();


            // window.alert(data.message)
        }catch(err){
                
            await dispatch(showError(err.response.data.message));
            await dispatch(clearError());
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
        const sourcePlaylist = allplaylists.find(playlist => playlist._id.toString() === _id?.toString());
        if(sourcePlaylist){
            const sourceSeletdSongs = sourcePlaylist.songs.map(song => song._id);
            setSelectedSongs(sourceSeletdSongs);
        }
    },[_id])
    return (
        <>
            <Dialog open={createPlaylistOpen} onClose={() => setCreatePlaylistOpen(false)} seletdSongs={seletdSongs} save={handleSubmit}>
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

export default EditPlaylistComponets