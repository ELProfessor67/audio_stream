"use client";
import {useSocketUser} from '@/hooks'
import {useRef} from 'react'
import {FiMoreVertical} from 'react-icons/fi'
import {FaPlay,FaPause} from 'react-icons/fa';
import {HiSpeakerWave,HiSpeakerXMark} from 'react-icons/hi2'
import Image from 'next/image';
import {useState,useEffect} from 'react';
import axios from 'axios';
import Dialog from '@/components/Dialog';


export default function page({params}){
	const [user, setUser] = useState(null);
	const [schediles,setSchedules] = useState([]);
	const [songs,setSongs] = useState([]);
	const [isPlay,setIsPlay] = useState(false);
	const [name,setName] = useState('');
	// const [soundOff,setSoundOff] = useState(false);
	const [volume,setVolume] = useState(1);
	const audioRef = useRef();
	const {roomActive,handleRequestSong,isLive} = useSocketUser(params.streamId,audioRef,name);
	const [more,setMore] = useState(false);
	const [rOpen,setROPen] = useState(false);
	console.log(roomActive)

	const handlePlay = () => {
		if(isPlay){
			audioRef.current.pause();
			setIsPlay(false);
		}else{
			audioRef.current.play();
			setIsPlay(true);
		}
	}


	useEffect(() => {
		audioRef.current.volume = volume;
	},[volume]);


	useEffect(() => {
		if(!roomActive){
			setIsPlay(false);
			audioRef.current.pause();
		}
	},[roomActive])


	useEffect(() => {
		(async function(){
			try{
				const {data} = await axios.get(`/api/v1/channel-detail/${params.streamId}`);
				setUser(data?.user);
				setSongs(data?.songs);
				setSchedules(data?.schedules);
			}catch(err){
				console.log(err?.response?.data?.message);
			}
		})();
	},[]);
	

	return(
		<section className="flex justify-center items-center h-[100vh] w-full">
			<div className="w-[35rem] p-4 shadow-md rounded-md border border-gray-100">
				<div className="flex justify-between items-center relative">
					<h2 className="text-2xl para">HGC LIVE RADIO</h2>
					<button className="bg-none border-none outline-none cursor-pointer"><FiMoreVertical size={20} onMouseEnter={() => setMore(true)} onMouseLeave={() => setMore(false)}/></button>

					{
						more && <div onMouseEnter={() => setMore(true)} onMouseLeave={() => setMore(false)} className="absolute top-5 border border-gray-100 right-[-15%] p-2 rounded-md shadow-md bg-white flex flex-col items-start gap-3">
							<button className="bg-none border-none outline-none text-black disabled:text-gray-200" disabled={!isLive} title="request for songs play" onClick={() => setROPen(true)}>Request</button>
							<button className="bg-none border-none outline-none text-black" title="schedule event times">Schedules</button>
							<button className="bg-none border-none outline-none text-black" title="now about our radio">About</button>
						</div>
					}
				</div>
				<div className="flex items-start py-4 border-b border-gray-200">
					<Image className="w-[8rem] h-[8rem] rounded-md" src="/upload/cover/ads.jpeg" width={200} height={200}/>
					<div className="p-4 flex flex-col gap-2 h-full">
						<div>
							<span className="px-5 py-1 rounded-3xl bg-indigo-500 text-white">{roomActive ? 'LIVE' : 'OFFLINE'}</span>
						</div>
						<h3 className="text-xl para">Zeeshan Raza</h3>
						<h4 className="text-sm opacity-40">You'Listen Zeeshan Raza Radio Channel</h4>
					</div>
				</div>
				<div className="w-full px-2 pt-1 mt-2 flex justify-between items-center">
					<button className="bg-indigo-500 disabled:bg-indigo-300 p-2 rounded-full border-none outline-none text-white" disabled={!roomActive} onClick={handlePlay}>
						{
							isPlay ? <FaPause/> : <FaPlay/>
						}
					</button>

					<div className="w-[50%] flex items-center">
						<button className="text-gray-300 mr-3" onClick={() => volume === 0 ? setVolume(0.5) : setVolume(0)}>
							{
								volume === 0 ? <HiSpeakerXMark size={22}/> : <HiSpeakerWave size={22}/>
							}
						</button>

						<input type="range" className="w-[90%]" min={0} max={1} step={0.1} value={volume} onChange={(e) => setVolume(e.target.value)}/>
					</div>
				</div>
				<audio ref={audioRef} controls className="w-full bg-none hidden"></audio>
			</div>
			<Dialog open={rOpen} onClose={() => setROPen(false)} name={name} setName={setName}>
				{
	        		songs && songs.map((data) => (
	        			<div className="flex justify-between items-center my-6">
	        				<div className="flex items-center gap-4">
	                            <Image src={data.cover} width={200} height={200} alt="cover" className="h-[4rem] w-[4rem] object-conver rounded"/> 
	                            <h2 className="text-xl text-black">{data?.title}</h2>           
	                        </div>

	                        <div className="mr-10">
	                            <button className="py-2 px-4 rounded-md text-white bg-indigo-500" title="request for this song" onClick={() => handleRequestSong(data)}>Request</button>
	                        </div>
	        			</div>
	        		))
	        	}
			</Dialog>
		</section>
	);
}