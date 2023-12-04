"use client";
import {useSocketUser} from '@/hooks'
import {useRef} from 'react'
import {FiMoreVertical} from 'react-icons/fi'
import {FaPlay,FaPause} from 'react-icons/fa';
import {HiSpeakerWave,HiSpeakerXMark} from 'react-icons/hi2'
import Image from 'next/image';
import {useState,useEffect} from 'react';


export default function page({params}){
	const [user, setUser] = useState(null);
	const [isPlay,setIsPlay] = useState(false);
	// const [soundOff,setSoundOff] = useState(false);
	const [volume,setVolume] = useState(1);
	const audioRef = useRef();
	const {roomActive} = useSocketUser(params.streamId,audioRef);
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
	

	return(
		<section className="flex justify-center items-center h-[100vh] w-full">
			<div className="w-[35rem] p-4 shadow-md rounded-md border border-gray-100">
				<div className="flex justify-between items-center">
					<h2 className="text-2xl para">HGC LIVE RADIO</h2>
					<button className="bg-none border-none outline-none cursor-pointer"><FiMoreVertical size={20}/></button>
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
		</section>
	);
}