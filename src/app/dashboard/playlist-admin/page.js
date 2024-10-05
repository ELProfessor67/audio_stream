"use client";

import {useState,useEffect} from 'react';
import axios from 'axios';
import Image from 'next/image';
import {FaArrowUpRightFromSquare,FaRegCopy} from 'react-icons/fa6';
import Link from 'next/link';
import {toast} from 'react-toastify'
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux'

export default function Page(){
	const [playlists,setPlaylists] = useState([]);
	const [myList,setMyList] = useState([]);
	const dispatch = useDispatch();

	
	useEffect(() => {
	    (
	      async function(){
	        try{
	          const {data} = await axios.get('/api/v1/playlist/admin');
	          setPlaylists(data?.playlists);
	          const {data:mdata} = await axios.get('/api/v1/playlist');
	          setMyList(mdata?.playlists);
	        }catch(err){
	          console.log(err.response.data.message);
	        }
	      }
	    )()
	  },[]);


	const handleMovePlaylist = async (data) => {
		try{
            
			let exist = myList.some(({title}) => {
				return data.title === title
			});
			
			if(exist){
				toast.info('Already copied');
				return
			}
			
			const seletdSongs =  data.songs.map(({_id}) => _id)

            const {data:res} = await axios.post('/api/v1/playlist',{title: data.title,description: data.description,songs: seletdSongs,isTemp: true});
            await dispatch(showMessage(res.message));
            await dispatch(clearMessage());
            setMyList(prev => [...prev,data]);

            // window.alert(data.message)
        }catch(error){
        	console.log(error)
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
            console.log(err.message);
        }
	}
	return(
		<>
			<section className="w-full py-5 px-4 reletive">
		      <div className="flex justify-center items-center">
		        <h1 className='main-heading my-10'>My Playlists</h1>
		      </div>
		      <div className="max-w-[55rem] m-auto reletive">
		      	{playlists.map(data => (
		      		<div className="flex justify-between items-center my-2 py-1 border-b border-gray-100">
	        			<div className="flex items-center gap-4">
	                            <Image src={data?.songs[0].cover} width={200} height={200} alt="cover" className="h-[8rem] w-32 object-conver rounded"/> 
	                            <div className="">
	                            	<h2 className="text-xl text-black">{data?.title}</h2>
	                            	<p className="para">{data?.description}</p>
	                            </div>        
	                        </div>

	                        <div className="mr-10">
	                            <button title="copy playlist" onClick={() => handleMovePlaylist(data)} className="text-gray-500"><FaRegCopy size={20}/></button>
	                       </div>
	        		</div>
		      	))}
		      </div>
		    </section>
		</>
	);
}