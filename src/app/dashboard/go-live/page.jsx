"use client";

import {LuPower,LuPowerOff} from 'react-icons/lu';
import {IoMdMic,IoMdMicOff,IoMdShare} from 'react-icons/io';
import {FaPlay,FaPause} from 'react-icons/fa';
import {useState,useEffect,useRef} from 'react';
import Image from 'next/image';
import axios from 'axios';
import {FaArrowUpRightFromSquare} from 'react-icons/fa6';
import Link from 'next/link';
import Dialog from '@/components/Dialog';
import {useSocket} from '@/hooks';


const Timer = ({timerStart}) => {
	const [straimgTime, setStraimgTime] = useState('00:00:00');
	const interValref = useRef();
	const [second,setSecond] = useState(0);

	const startTime = () => {
		interValref.current = setInterval(() => {
			setSecond(prev => prev+1);
		},1000);

	}

	useEffect(() => {
		let hour = Math.floor(second / 3600);
		let min = Math.floor((second % 3600) / 60);
		let sec = Math.floor((second % 3600) % 60);

		// console.log(second)

		if(hour < 10) hour = `0${hour}`;
		if(min < 10) min = `0${min}`;
		if(sec < 10) sec = `0${sec}`;

		// console.log(`${hour}:${min}:${sec}`)
		setStraimgTime(`${hour}:${min}:${sec}`);
	},[second]);

	const stopTime = () => {
		clearInterval(interValref.current);
	}

	useEffect(() => {
		console.log(timerStart);
		if(timerStart){
			startTime();
		}else{
			stopTime();
		}
	},[timerStart])
	return <h2 className="text-white text-xl text-center">{straimgTime}</h2>
}

export default function(){
	const [volume,setVolume] = useState(0.2);
	const [playlists,setPlaylists] = useState([]);
	const [selectPlayListSong, setSelectPlayListSong] = useState([]);
	const [open, setOpen] = useState(false);
	const [selectedSong, setSeletedSong] = useState({});
	// const [straimgTime, setStraimgTime] = useState('00:00:00');
	const [start,setStart] = useState(false);
	const [songPlaying,setSongPlaying] = useState(false);
	const [timerStart, setTimerStart] = useState(false);
	
	const {ownerJoin,ownerLeft,micOn,playSong,pauseSong,changeValume,SwitchOn,handleShare} = useSocket(setSongPlaying);

	// useEffect(() => {
	// 	console.log('before play');
	// 	if(selectedSong.audio){
	// 		console.info('play')
	// 		playSong(selectedSong.audio);
	// 	}
	// },[selectedSong]);


	const handleVolumeChange = (e) => {
		const value = e.target.value;
		changeValume(value);
		setVolume(value);
	}

	
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


	const handlePlaylist = (data) => {
		setSelectPlayListSong(data.songs);
		setOpen(true);
		console.log(data);
	}

	const handleStart = () => {
		if(!start){
			setTimerStart(true);
			setStart(true);
			ownerJoin();
			
			console.log('handle start')
		}else{
			setTimerStart(false);
			setStart(false);
			ownerLeft();
			console.log('off')
		}
	}


	const handleSelectedSong = (data) => {
		setSeletedSong(data);
		setOpen(false);
		setSongPlaying(true);
		playSong(data.audio,volume);
	}

	const handleSongPlay = () => {
		if(songPlaying){
			setSongPlaying(false);
			pauseSong();
		}else{
			setSongPlaying(true);
			playSong(selectedSong.audio,volume);
		}
	}




	return(
		<>
			<section className="w-full py-5 px-4 reletive">
		      <div className="w-full flex">
		        <div className="side-box w-[22rem] p-2 reletive">
		        	<div className="w-full">
		        		<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between">
		        			<h2 className="text-white text-xl text-center">Streaming Time</h2>
		        			<Timer timerStart={timerStart}/>
		        		</div>
		        		<div className="py-2 rounded-b-md flex justify-center shadow-md">
		        			<button onClick={handleStart} className={`bg-none outline-none border-none ${start ? 'text-green-400': 'text-red-600'}`}><LuPower size={40}/></button>
		        		</div>
		        	</div>

		        	<div className="w-full p-3 shadow-md rounded-md mt-5 border border-gray-100">
		        		<div className="flex justify-center">
		        			<button className="bg-none outline-none border-none text-black" onClick={SwitchOn}>
		        				{micOn 
		        				? <IoMdMic size={40}/>
		        				: <IoMdMicOff size={40}/>
		        				}
		        			</button>
		        		</div>

		        		<div className="flex justify-center mt-5">
		        			<button className="bg-none outline-none border-none text-black" onClick={handleShare}>
		        				<IoMdShare size={40}/>
		        			</button>
		        		</div>
		        	</div>
		        </div>

		        <div className="side-box-right flex-1 p-2 reletive">
		        	{ selectedSong?.title &&
		        		<div className="w-full">
		        		<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
		        			<h2 className="text-white text-xl text-center">Song Volume</h2>
		        			<div className="w-[50%] reletive">
		        				<input type="range" className="w-full cursor-pointer" min={0} max={1} value={volume} step="0.1" onChange={handleVolumeChange}/>

		        				<div className="w-full flex items-center justify-between mt-1 px-1">
		        					<span className="text-white">0</span>
		        					<span className="text-white">1</span>
		        					<span className="text-white">2</span>
		        					<span className="text-white">3</span>
		        					<span className="text-white">4</span>
		        					<span className="text-white">5</span>
		        					<span className="text-white">6</span>
		        					<span className="text-white">7</span>
		        					<span className="text-white">8</span>
		        					<span className="text-white">9</span>
		        					
		        				</div>
		        			</div>
		        		</div>
		        		<div className="py-2 rounded-b-md shadow-md p-3">
		        			<div className="flex">
		        				<Image src={selectedSong?.cover} width={200} height={200} className="w-[5rem] h-[5rem] rounded-md"/>
		        				
		        				<div className="flex flex-col px-3 justify-center">
		        					<h2 className="text-black text-xl font-semibold">{selectedSong?.title}</h2>
		        					<p className="para">~ {selectedSong?.artist}</p>
		        				</div>
		        				<div className="flex-1 flex justify-center items-center">
		        					<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={handleSongPlay}>
		        					    {songPlaying ? <FaPause size={20}/> : <FaPlay size={20}/>}
		        					</button>
		        				</div>
		        			</div>
		        		</div>
		        		</div>
		        	}

		        		
		        	

		        	<div className="w-full mt-5">
		        		<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
		        			<h2 className="text-white text-xl text-center">Playlists</h2>
		        		</div>
		        		<div className="py-2 rounded-b-md shadow-md p-3 h-[21rem] overflow-x-auto">
		        			{playlists.map(data => (
					      		<div className="flex justify-between items-center my-2 py-1 border-b border-gray-100">
				        			<div className="flex items-center gap-4">
				                            <Image src={data?.songs[0].cover} width={200} height={200} alt="cover" className="w-[5rem] h-[5rem] rounded-md"/> 
				                            <div className="">
				                            	<h2 className="text-black text-xl font-semibold">{data?.title}</h2>
				                            	<p className="para">{data?.description}</p>
				                            </div>        
				                        </div>

				                        <div className="mr-10">
				                            <button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handlePlaylist(data)}><FaArrowUpRightFromSquare size={20}/></button>
				                       </div>
				        		</div>
					      	))}
		        		</div>
		        	</div>
		        </div>
		      </div>
		      <Dialog open={open} onClose={() => setOpen(false)}>
	          {
	            selectPlayListSong && selectPlayListSong.map((data) => (
	              <div className="flex justify-between items-center my-6">
	                <div className="flex items-center gap-4">
	                    <Image src={data.cover} width={200} height={200} alt="cover" className="h-[6rem] w-28 object-conver rounded"/> 
	                    <h2 className="text-xl text-black">{data?.title}</h2>           
	                </div>

	                <button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data)}><FaPlay size={20}/></button>       
	              </div>
	            ))
	          }
	        </Dialog>
	           
		    </section>
		</>
	);
}