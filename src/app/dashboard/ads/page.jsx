"use client"
import Link from 'next/link'
import React,{useState,useEffect,useRef} from 'react'
import axios from 'axios';
import SongCard from '@/components/SongCard';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';


export default function page(){
	const [songs,setSongs] = useState([]);
	  const [playSong,setPlaySong] = useState('');
	  const songRef = useRef();
	  const dispatch = useDispatch();


	  useEffect(() => {
	    if(playSong){
	      songRef.current.src = playSong;
	      songRef.current.play();
	      songRef.current.addEventListener('loadedmetadata',function(){
	        console.log('duration',this.duration);           
	      })

	      console.log('play',playSong,songRef)
	    }else{
	      console.log('pause',playSong,songRef)
	      songRef.current.pause();
	    }
	  },[playSong]);

	  useEffect(() => {
	    (
	      async function(){
	        try{
	          const {data} = await axios.get('/api/v1/ads');
	          setSongs(data?.songs);
	        }catch(err){
	          console.log(err.response.data.message);
	        }
	      }
	    )()
  },[]);

	  const deleteSong = async (id) => {
	    try{
	      const {data} = await axios.delete(`/api/v1/ads?id=${id}`);
	      console.log(data.message);
	      await dispatch(showMessage(data.message));
	      await dispatch(clearMessage());

	      const {data:sdata} = await axios.get('/api/v1/ads');
	      setSongs(sdata?.songs);
	      
	    }catch(error){
	        await dispatch(showError(error.response.data.message));
	        await dispatch(clearError());
	        console.log(error.message)
	    }
	  }
	return(
		<section className="w-full py-5 px-4 reletive">
	      <div className="flex justify-center items-center">
	        <h1 className='main-heading mt-10'>Ads</h1>
	      </div>
	      <div className="flex justify-end items-center mb-5">
	      	<Link href="/dashboard/ads/create" className="py-2 px-4 rounded-md bg-indigo-500 text-white">Add Ads</Link>
	      </div>

	      <div className="flex justify-start items-center flex-wrap">
	        {
	          songs.length != 0 ?  songs.map((data) => (
	            <>
	              <SongCard {...data} setPlaySong={setPlaySong} playSong={playSong} deleteSong={deleteSong}/>
	            </>
	          ))
			  : <h1 className='text-center text-xl text-gray-700 mt-10'>
					No ads Here
			  </h1>
	        }
	      </div>
	      <audio ref={songRef} className="hidden"></audio>
	    </section>
	);
}