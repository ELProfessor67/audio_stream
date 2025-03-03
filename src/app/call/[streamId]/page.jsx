"use client";
import { useSocketUser } from '@/hooks'
import { useRef } from 'react'
import { FiMoreVertical } from 'react-icons/fi'
import { FaPlay, FaPause } from 'react-icons/fa';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2'
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { CiSquareQuestion } from 'react-icons/ci'
import ChatBox from '@/components/ChatBox';
import Message from '@/components/Message';
import { MdCall } from "react-icons/md";
import CallComponents from '@/components/CallComponents';
import { FaUser } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";

function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}


const Timer = ({ timerStart }) => {
	const [straimgTime, setStraimgTime] = useState('00:00:00');
	const interValref = useRef();
	const [second, setSecond] = useState(0);


	const startTime = () => {
		interValref.current = setInterval(() => {
			setSecond(prev => prev + 1);
		}, 1000);

	}

	useEffect(() => {
		let hour = Math.floor(second / 3600);
		let min = Math.floor((second % 3600) / 60);
		let sec = Math.floor((second % 3600) % 60);

		// console.log(second)

		if (hour < 10) hour = `0${hour}`;
		if (min < 10) min = `0${min}`;
		if (sec < 10) sec = `0${sec}`;

		// console.log(`${hour}:${min}:${sec}`)
		setStraimgTime(`${hour}:${min}:${sec}`);
	}, [second]);

	const stopTime = () => {
		clearInterval(interValref.current);
	}

	useEffect(() => {
		console.log(timerStart);
		if (timerStart) {
			startTime();
		} else {
			stopTime();
		}
	}, [timerStart])
	return <span>{straimgTime}</span>
}


export default function page({ params }) {
	const [user, setUser] = useState(null);
	const [schediles, setSchedules] = useState([]);
	const [songs, setSongs] = useState([]);
	const [isPlay, setIsPlay] = useState(false);
	const [message, setMessage] = useState('');
	const [name, setName] = useState('');
	const [location, setLocation] = useState('');
	const [gedetailOpen,setGetDetailsOpne] = useState(false);
	const [callOpen, setCallOpen] = useState(false);
	const [permissionReset,setPermissionReset] = useState(false);
	// null,processing,accepted,rejected
	const [callStatus, setCallStatus] = useState(null);
	// const [soundOff,setSoundOff] = useState(false);
	const [volume, setVolume] = useState(1);
	const [record, setRecord] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const audioRef = useRef();
	const mediaRecorder = useRef(null);
	const recordedChunks = useRef([]);
	const downloadLink = useRef();

	// console.log('isPlay from components side', isPlay)
	const { roomActive, handleRequestSong, isLive, autodj, messageList, handleSendMessage, callAdmin, cutCall,nextSong } = useSocketUser(params.streamId, audioRef, name, isPlay, setIsPlay, message, setMessage, setCallStatus,location,true);
	// const [more,setMore] = useState(false);
	const [rOpen, setROPen] = useState(false);
	console.log(roomActive)

	const handlePlay = () => {
		if (isPlay) {
			audioRef.current.pause();
			setIsPlay(false);
		} else {
			audioRef.current.play();
			setIsPlay(true);
		}
	}


	useEffect(() => {
		audioRef.current.volume = volume;
	}, [volume]);


	useEffect(() => {
		if (!roomActive) {
			setIsPlay(false);
			audioRef.current.pause();
		}
	}, [roomActive])


	useEffect(() => {
		(async function () {
			try {
				const { data } = await axios.get(`/api/v1/channel-detail/${params.streamId}`);
				setUser(data?.user);
				setSongs(data?.songs);
				setSchedules(data?.schedules);
			} catch (err) {
				console.log(err?.response?.data?.message);
			}
		})();
	}, []);


	function startRecording() {
		const audioStream = audioRef.current.captureStream();

		// Create a MediaRecorder instance
		mediaRecorder.current = new MediaRecorder(audioStream);

		// Listen for data available event
		mediaRecorder.current.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordedChunks.current.push(event.data);
			}
		};

		// Listen for the recording stop event
		mediaRecorder.current.onstop = () => {
			const blob = new Blob(recordedChunks.current, { type: 'audio/wav' });
			const url = URL.createObjectURL(blob);
			downloadLink.current.href = url;
			downloadLink.current.download = 'live_session.wav';
			downloadLink.current.click();
		};

		// Start recording
		mediaRecorder.current.start();
	}

	function stopRecording() {
		// Stop recording
		mediaRecorder.current.stop();
	}

	const handleRecord = () => {
		if (record) {
			setRecord(false);
			stopRecording();
		} else {
			setRecord(true);
			startRecording();
		}
	}

	const handleCall = async () => {
		const audioPermissionStatus = await navigator.permissions.query({ name: 'microphone' });
		// if (audioPermissionStatus.state === 'granted' || audioPermissionStatus.state === 'denied') {
		// 		setPermissionReset(true);
		// 		return
		// }

		if(!name || !location){
			setGetDetailsOpne(true);
			return
		}else{
			setGetDetailsOpne(false);
		}
		setCallOpen(true);
		if (callStatus == 'processing' || callStatus == 'accepted') return
		setCallStatus('processing');
		callAdmin();
		// handle calling
	}

	useEffect(() => {
		if(isLive){
			handleCall();
		}
	},[isLive])

	return (
		<section className="flex justify-center items-center h-[100vh] w-full px-4 bg-[#1a1d22]">
			<a className="hidden" ref={downloadLink}></a>
			<div className="max-w-[38rem] p-4 shadow-md rounded-md border border-gray-100 hidden">
				<div className="flex justify-between flex-col md:flex-row items-center relative gap-5 md:gap-5">
					<h2 className="text-2xl para whitespace-pre">HGC LIVE RADIO</h2>
					<div className="flex items-center flex-wrap md:flex-nowrap gap-3 md:gap-0 justify-center md:justify-start">
						<button className="bg-indigo-500 text-xs border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-indigo-200 cursor-pointer disabled:text-gray-200 mr-2" disabled={!isLive} title="live chat" onClick={handleCall}>Call</button>
						<button className="bg-indigo-500 text-xs border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-indigo-200 cursor-pointer disabled:text-gray-200 mr-2" disabled={!isLive} title="live chat" onClick={() => setChatOpen(true)}>Chat</button>

						<button className="bg-indigo-500 text-xs border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-indigo-200 cursor-pointer disabled:text-gray-200 mr-2" disabled={!isLive} title="record live" onClick={handleRecord}>{record ? <Timer timerStart={record} /> : 'Record'}</button>

						<button className="bg-indigo-500 text-xs border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-indigo-200 cursor-pointer disabled:text-gray-200" disabled={!isLive} title="request for songs play" onClick={() => setROPen(true)}>Request for song</button>
					</div>
				</div>
				<div className="flex py-4 border-b border-gray-200 flex-col items-center md:items-start md:flex-row">
					<Image className="w-[8rem] h-[8rem] rounded-md" src="/upload/cover/ads.jpeg" width={200} height={200} />
					<div className="p-4 flex flex-col gap-2 h-full items-center md:items-start">
						<div>
							<span className="px-5 py-1 rounded-3xl bg-indigo-500 text-white">{isLive ? 'LIVE' : 'AUTO DJ'}</span>
						</div>
						<h3 className="text-xl para">{user?.name}</h3>
						<h4 className="text-sm opacity-40">You'Listen {user?.name} Radio Channel</h4>
						{
							nextSong?.title &&
							<>
							<h4 className='text-lg'>Next song :  <span className='text-gray-500'>{nextSong?.title}</span></h4>
							{
								isLive ? 
								<h4>{nextSong?.user?.name}</h4>
								: <h4>Auto DJ</h4>
							}
							</>
						}
					</div>
				</div>
				<div className="w-full px-2 pt-1 mt-2 flex justify-between items-center flex-col md:flex-row gap-5 md:gap-0">
					<div className='flex items-center gap-3'>
						<button className="bg-indigo-500 disabled:bg-indigo-300 p-2 rounded-full border-none outline-none text-white" disabled={!roomActive} onClick={handlePlay}>
							{
								isPlay ? <FaPause /> : <FaPlay />
							}
						</button>
						<span className='text-lg text-gray-700'>Listen Now</span>
					</div>

					<div className="md:w-[50%] w-full flex items-center">
						<button className="text-gray-300 mr-3" onClick={() => volume === 0 ? setVolume(0.5) : setVolume(0)}>
							{
								volume === 0 ? <HiSpeakerXMark size={22} /> : <HiSpeakerWave size={22} />
							}
						</button>

						<input type="range" className="w-[90%]" min={0} max={1} step={0.1} value={volume} onChange={(e) => setVolume(e.target.value)} />
					</div>
				</div>
			</div>
			<audio ref={audioRef} controls className="w-full bg-none hidden"></audio>
			
			<div className=" shadow-md rounded-md border  flex justify-center items-center border-[#1a1d22]">
				<button className="bg-[#f00000] text-xs border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-[#f000008e] cursor-pointer disabled:text-gray-200 mr-2" disabled={!isLive} title="live chat" onClick={handleCall}>Click To Call</button>
			</div>
			
			<Dialog open={rOpen} onClose={() => setROPen(false)} name={name} setName={setName}>
				{
					songs && songs.map((data) => (
						<div className="flex justify-between items-center my-6">
							<div className="flex items-center gap-4">
								<Image src={data.cover} width={200} height={200} alt="cover" className="h-[4rem] w-[4rem] object-conver rounded" />
								<h2 className="text-xl text-black">{data?.title}</h2>
							</div>

							<div className="mr-10">
								<button className="py-2 px-4 rounded-md text-white bg-indigo-500" title="request for this song" onClick={() => handleRequestSong(data)}>Request</button>
							</div>
						</div>
					))
				}
			</Dialog>


			{/* mannual  */}
			<Dialog open={permissionReset} onClose={() => setPermissionReset(false)}>
				<div className=''>
					<h2 className='text-center mb-8 text-2xl text-gray-700'>Reset Permission</h2>
					<ol className='text-lg flex text-gray-600 flex-col gap-3 list-decimal'>
						<li>1. Click On i button</li>
						<li><img src='/images/1.png' className='w-[20rem]'/></li>
						<li>2. Click on the reset permission</li>
						<li><img src='/images/2.png' className='w-[20rem]'/></li>

						<li>3. click on reload button"</li>
						<li><img src='/images/3.png' className='w-[20rem]'/></li>
					</ol>
				</div>
			</Dialog>


			<ChatBox open={chatOpen} onClose={() => setChatOpen(false)} name={name} setName={setName} message={message} setMessage={setMessage} handleSendMessage={handleSendMessage}>
				{
					messageList.map(data => <Message {...data} />)
				}
			</ChatBox>

			<CallComponents open={callOpen} onClose={() => setCallOpen(false)} name={name} setName={setName}>
				<div className='w-full h-full flex flex-col gap-5 justify-center items-center'>
					<h2 className='text-3xl text-white'>{user?.name && toTitleCase(user?.name)}</h2>
					{
						callStatus == 'processing' &&
						<div className='flex items-center'>
							<h3 className='text-lg text-white'>Calling</h3>
							<div class="loading flex gap-1 items-center ml-1">
								<div class="dot bg-white/80 w-1 h-1 rounded-full"></div>
								<div class="dot bg-white/80 w-1 h-1 rounded-full"></div>
								<div class="dot bg-white/80 w-1 h-1 rounded-full"></div>
							</div>
						</div>
					}

					{
						callStatus == 'accepted' &&
						<h3 className='text-lg text-white'><Timer timerStart={true} /></h3>

					}
					{
						callStatus == 'rejected' &&
						<h3 className='text-lg text-white'>Call Rejected</h3>

					}
					{
						callStatus == 'complete' &&
						<h3 className='text-lg text-white'>Call Complete</h3>

					}
					{
						callStatus == 'rejected' || callStatus == 'complete' ?
							<button className='p-2 text-green-600 rounded-full bg-gray-200' onClick={handleCall}><MdCall size={23} /></button>
							:
							<button className='p-2 text-red-600 rounded-full bg-gray-200' onClick={cutCall}><MdCall size={23} /></button>
					}
				</div>
			</CallComponents>


			<CallComponents open={gedetailOpen} onClose={() => setGetDetailsOpne(false)}>
					<div>
						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="password" className='text-white text-lg'>Name</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-[#f00000] rounded-md'>
								<FaUser size={20} className='text-gray-400'/>
								<input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] bg-transparent outline-none ml-1' placeholder='Enter your name' id='password' name='password' required/>
							</div>   
						</div>
						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="password" className='text-white text-lg'>Location</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-[#f00000] rounded-md'>
								<FaLocationDot size={20} className='text-gray-400'/>
								<input type='text' value={location} onChange={(e) => setLocation(e.target.value)} className='w-[95%] bg-transparent outline-none ml-1' placeholder='Enter your localtion' id='password' name='password' required/>
							</div>   
						</div>

						<div className='flex justify-center items-center'>
							<button type='submit' onClick={handleCall} className='py-2 px-4 rounded-md bg-[#f00000] text-white text-lg hover:bg-[#f00000] transition-al disabled:opacity-40' disabled={!name || !location}>Call Now</button>
						</div>
					</div>
			</CallComponents>
		</section>
	);
}