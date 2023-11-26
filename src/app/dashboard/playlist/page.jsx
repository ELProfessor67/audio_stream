"use client";

import {useState,useEffect} from 'react';
import axios from 'axios';
import Image from 'next/image';
import {FaArrowUpRightFromSquare} from 'react-icons/fa6';
import Link from 'next/link';

export default function Page(){
	const [playlists,setPlaylists] = useState([]);

	
	useEffect(() => {
	    (
	      async function(){
	        try{
	          const {data} = await axios.get('/api/v1/playlist');
	          setPlaylists(data?.playlists);
	        }catch(err){
	          console.log(err.response.data.message);
	        }
	      }
	    )()
	  },[]);
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
	                            <Link href={`/dashboard/playlist/${data._id}`} className="text-gray-500"><FaArrowUpRightFromSquare size={20}/></Link>
	                       </div>
	        		</div>
		      	))}
		      </div>
		    </section>
		</>
	);
}