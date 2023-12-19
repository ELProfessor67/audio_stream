"use client";

import {useState,useEffect} from 'react';
import axios from 'axios';
import Image from 'next/image';
import {FaArrowUpRightFromSquare} from 'react-icons/fa6';
import Link from 'next/link';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert';
import {useDispatch} from 'react-redux';
import {MdDelete} from 'react-icons/md'

export default function Page(){
	const [playlists,setPlaylists] = useState([]);
	const dispatch = useDispatch();
	
	useEffect(() => {
	    (
	      async function(){
	        try{
	          const {data} = await axios.get('/api/v1/temp-playlist');
	          let temp = data?.playlists?.filter(ele => ele.isTemp);
	          setPlaylists(temp);
	        }catch(err){
	          console.log(err?.response?.data?.message);
	        }
	      }
	    )()
	  },[]);

	const deletePlaylist = async (id) => {
		try{
			const {data:rdata} = await axios.delete(`/api/v1/temp-playlist?id=${id}`);
			console.log(rdata.message);
			await dispatch(showMessage(rdata.message));
      		await dispatch(clearMessage());
      		const {data} = await axios.get('/api/v1/temp-playlist');
	        let temp = data?.playlists?.filter(ele => ele.isTemp);
	        setPlaylists(temp);
		}catch(error){
				await dispatch(showError(error.response.data.message));
        await dispatch(clearError());
				console.log(error.message)
		}
	}
	return(
		<>
			<section className="w-full py-5 px-4 reletive">
		      <div>
		      	<div className="flex justify-center items-center">
		        	<h1 className='main-heading my-10'>My Playlists</h1>
		        </div>
		        <div className="flex justify-end items-center mb-4">
		      		<Link href="/dashboard/manage-live/create" className="py-2 px-4 rounded-md bg-indigo-500 text-white">Add More</Link>
		      	</div>
		      </div>
		      <div className="max-w-[55rem] m-auto reletive">
		      	{playlists.map(data => (
		      		<div className="flex justify-between items-center my-2 py-1 border-b border-gray-100">
	        			<div className="flex items-center gap-4">
	                            <Image src={data?.songs[0]?.cover} width={200} height={200} alt="cover" className="h-[8rem] w-32 object-conver rounded"/> 
	                            <div className="">
	                            	<h2 className="text-xl text-black">{data?.title}</h2>
	                            	<p className="para">{data?.description}</p>
	                            </div>        
	                    </div>

	                        <div className="mr-10 flex items-center gap-4">
	                        	<button onClick={() => deletePlaylist(data._id)} className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400"><MdDelete size={20}/></button>
	                            <Link href={`/dashboard/manage-live/${data._id}`} className="text-gray-500"><FaArrowUpRightFromSquare size={20}/></Link>
	                       </div>
	        		</div>
		      	))}
		      </div>
		    </section>
		</>
	);
}