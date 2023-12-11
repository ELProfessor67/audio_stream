"use client";

import {LuPower,LuPowerOff} from 'react-icons/lu';
import {IoMdMic,IoMdMicOff,IoMdShare} from 'react-icons/io';
import {FaPlay,FaPause} from 'react-icons/fa';
import {useState,useEffect,useRef} from 'react';
import Image from 'next/image';
import axios from 'axios';
import {FaArrowUpRightFromSquare,FaRegMessage} from 'react-icons/fa6';
import Link from 'next/link';
import Dialog from '@/components/Dialog';
import {useSocket} from '@/hooks';
import {MdModeEdit} from 'react-icons/md'
import {useDispatch} from 'react-redux';
import {showMessage,showError,clearMessage,clearError} from '@/utils/showAlert'


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
	const [que,setQue] = useState([]);
	const [message,setMessage] = useState('');
	const [medit,setMEdit] = useState(false);
	const [listners,setListners] = useState('0');
	const dispatch = useDispatch();
	
	const {ownerJoin,ownerLeft,micOn,playSong,pauseSong,changeValume,SwitchOn,handleShare,requests,peersRef} = useSocket(setSongPlaying);


	useEffect(() => {
		if(peersRef){
			if(Object.keys(peersRef).length < 1000){
				setListners(Object.keys(peersRef).length);
			}else{
				setListners(`${Object.keys(peersRef).length/1000}k`)
			}
		}
	},[peersRef])

	// console.log('requests list',requests)

	// useEffect(() => {
	// 	console.log('before play');
	// 	if(selectedSong.audio){
	// 		console.info('play')
	// 		playSong(selectedSong.audio);
	// 	}
	// },[selectedSong]);

	function getHistory(){
		let history = window.localStorage.getItem('history');
		if(!history){
			window.localStorage.setItem('history','[]');
			history = window.localStorage.getItem('history');
		}
		console.info('history',history)
		const parseQue = JSON.parse(history);
		setQue(parseQue);
	}

	function setHistory(data){
		const history = window.localStorage.getItem('history');
		let parseQue = JSON.parse(history);
		parseQue = [data,...parseQue];
		let stringifyQue = JSON.stringify(parseQue);
		window.localStorage.setItem('history',stringifyQue);
		getHistory();
	}

	useEffect(() => {
		getHistory();
	},[])




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
	          const {data:mdata} = await axios.get('/api/v1/announcement');
	          if(mdata?.announcement){
	          	setMessage(mdata?.announcement?.message);
	          }
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
		// setQue(prev => [data,...prev]);
		setHistory(data);
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


	const handleMessageSubmit = async (e) => {
		e.preventDefault();
		try {
            const {data} = await axios.post('/api/v1/announcement',{message});
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            setMEdit(false);
            console.log(data.message);
        } catch (error) {
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
            console.log(error.response.data.message)
        }
	}


	const handleUpload = async (e) => {
		const [file] = e.target.files;

        const reader = new FileReader();

        reader.onload = function(){
            if(reader.readyState == 2){
                const base64String = reader.result;
                const extention = file.name.split('.').reverse()[0]
                const title = file.name.split('.')[0];
                
                const audio = new Audio(base64String);
                audio.addEventListener('loadedmetadata',async function(){
                    // console.log('duration',audio.duration);
                    try{
                    	const {data} = await axios.post('/api/v1/song',{audioEx:extention,coverEx:'',title,description:'description',artist: 'unknown',size:file.size,type:file.type,cover:'/upload/cover/default.jpg',audio: base64String,duration:audio.duration});

                    	handleSelectedSong(data.song);
                    	console.log(data.song);
                    }catch(err){
                    	console.log(err)
                    }
                })
            }
        }

        reader.readAsDataURL(file);
	}

	return(
		<>
			<section className="w-full py-5 px-4 reletive">
				<div className="m-auto p-4 max-w-[50rem] flex items-center justify-center gap-3">
					<h3 className="text-2xl text-gray-600">{message}</h3>
					<button onClick={() => setMEdit(true)} className="bg-none outline-none border-none text-green-400 hover:text-green-500"><MdModeEdit size={20}/></button>
				</div>
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

		        	<div  className="w-full shadow-md rounded-md mt-5 border border-gray-100 h-[60vh]">
		        		<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
		        			<h3 className="text-xl text-white">History</h3>
		        		</div>


		        		<div className="p-2 overflow-y-auto h-[85%]">
		        			{
		        				que?.length != 0 && que.map((data) => (
		        					<div className="w-full p-1 my-2 border-b border-gray-100">
				        				<div className="flex justify-between items-center">
							                <div className="flex items-center gap-4">
							                    <Image src={data?.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded"/> 
							                    <h2 className="text-black">{data?.title?.slice(0,40)}</h2>           
							                </div>

							                <button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data)}><FaPlay size={20}/></button>       
							              </div>
				        			</div>
		        				))
		        			}
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
		        					<h2 className="text-black text-xl font-semibold">{selectedSong?.title?.slice(0,40)}</h2>
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
		        			
		        			
		        			<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => document.getElementById('audio').click()}>Media</button>
		        			
		        			<input type="file" accept="audio/*" className="hidden" id="audio" onChange={handleUpload}/>
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



		        <div className="side-box w-[22rem] p-2 reletive flex flex-col">
		        	<div className="w-full shadow-md border border-gray-100 h-[95vh] rounded-md">
		        		<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
		        			<h3 className="text-xl text-white">Requests</h3>
		        			<h3 className="text-white text-sm">{listners} Listening</h3>
		        		</div>
		        		<div className="p-2 overflow-y-auto h-[85%]">
		        			{
		        				requests?.length != 0 && requests.map((data) => (
		        					<div className="w-full p-1 my-2 border-b border-gray-100">
				        				<h4 className="text-sm text-gray-300">{data?.name} requested</h4>
				        				<div className="flex justify-between items-center my-2">
							                <div className="flex items-center gap-4">
							                    <Image src={data?.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded"/> 
							                    <h2 className="text-black">{data?.title?.slice(0,40)}</h2>           
							                </div>

							                <button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data)}><FaPlay size={20}/></button>       
							              </div>
				        			</div>
		        				))
		        			}
		        			
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
	                    <h2 className="text-xl text-black">{data?.title?.slice(0,40)}</h2>           
	                </div>

	                <button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data)}><FaPlay size={20}/></button>       
	              </div>
	            ))
	          }
	        </Dialog>


	        <Dialog open={medit} onClose={() => setMEdit(false)}>
	        	<form onSubmit={handleMessageSubmit}>
	        		 <div className='input-group flex flex-col gap-1 mb-6'>
                        <div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                            <FaRegMessage size={20} className='text-gray-400'/>
                            <input type='text' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your email' id='message' name='message' required/>
                        </div>
                        <div className='flex justify-center items-center'>
                        <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>Update</button>
                    </div>
                    </div>
	        	</form>
	        </Dialog>
	           
		    </section>
		</>
	);
}