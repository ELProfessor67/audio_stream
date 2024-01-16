"use client";

import { LuPower, LuPowerOff } from 'react-icons/lu';
import { IoMdMic, IoMdMicOff, IoMdShare } from 'react-icons/io';
import { FaPlay, FaPause } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { FaArrowUpRightFromSquare, FaRegMessage } from 'react-icons/fa6';
import Link from 'next/link';
import Dialog from '@/components/Dialog';
import { useSocket } from '@/hooks';
import { MdModeEdit } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert'
import { FaForward, FaBackward } from "react-icons/fa";
import { IoSearch } from 'react-icons/io5';
import { BsSoundwave } from 'react-icons/bs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MdDelete, MdAdd } from 'react-icons/md'
import ChatBox from '@/components/ChatBox';
import Message from '@/components/Message';

function organizeHistoryByDate(history) {
	const organizedHistory = {};

	history.forEach((entry) => {
		const createdAtDate = new Date(entry.createdAt).toISOString().split('T')[0];

		if (isToday(createdAtDate)) {
			organizedHistory.today = organizedHistory.today || [];
			organizedHistory.today.push(entry);
		} else if (isYesterday(createdAtDate)) {
			organizedHistory.yesterday = organizedHistory.yesterday || [];
			organizedHistory.yesterday.push(entry);
		} else {
			organizedHistory[createdAtDate] = organizedHistory[createdAtDate] || [];
			organizedHistory[createdAtDate].push(entry);
		}
	});

	return organizedHistory;
}

function isToday(dateString) {
	const today = new Date().toISOString().split('T')[0];
	return dateString === today;
}

function isYesterday(dateString) {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return dateString === yesterday.toISOString().split('T')[0];
}

function mergeAudioObjectURLs(audioURLs) {
	const audioContext = new (window.AudioContext || window.webkitAudioContext)();

	// Fetch and decode each audio URL
	const promises = audioURLs.map(url =>
		fetch(url)
			.then(response => response.arrayBuffer())
			.then(data => audioContext.decodeAudioData(data))
	);

	return Promise.all(promises)
		.then(buffers => {
			// Calculate the total length of the merged audio
			const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);

			// Create a new buffer with combined length
			const combinedBuffer = audioContext.createBuffer(
				buffers[0].numberOfChannels,
				totalLength,
				buffers[0].sampleRate
			);

			// Copy data into the new buffer
			let offset = 0;
			buffers.forEach(buffer => {
				for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
					combinedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
				}
				offset += buffer.length;
			});

			// Create Object URL from the merged buffer
			const mergedObjectURL = URL.createObjectURL(new Blob([combinedBuffer], { type: 'audio/wav' }));
			return mergedObjectURL;
		});
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
	return <h2 className="text-white text-xl text-center">{straimgTime}</h2>
}

export default function () {
	const [volume, setVolume] = useState(0.1);
	const [playlists, setPlaylists] = useState([]);
	const [selectPlayListSong, setSelectPlayListSong] = useState([]);
	const [open, setOpen] = useState(false);
	const [selectedSong, setSeletedSong] = useState({});
	// const [straimgTime, setStraimgTime] = useState('00:00:00');
	const [start, setStart] = useState(false);
	const [songPlaying, setSongPlaying] = useState(false);
	const [timerStart, setTimerStart] = useState(false);
	const [que, setQue] = useState({});
	const [message, setMessage] = useState('');
	const [medit, setMEdit] = useState(false);
	const [listners, setListners] = useState('0');
	const [dforward, setDforward] = useState(false);
	const [dbackward, setDbackward] = useState(false);
	const [allsongs, setAllSongs] = useState([]);
	const [sopen, setsopen] = useState(false);
	const [query, setQuery] = useState('');
	const [filtersongs, setFiltersongs] = useState([]);
	const [effectsong, setEffectSong] = useState([]);
	const [selectedFilter, setSelectedFilter] = useState({});
	const [filterPlaying, setFilterPlaying] = useState(false);
	const [filtervolume, setFilterVolume] = useState(0.1);
	const [fileload, setFileLoad] = useState(0);
	const [filterload, setFilterload] = useState(0);
	const [filterSearch, setFilterSearch] = useState([]);
	const [filterQuery, setFilterQuery] = useState('');
	const [fsopen, fsetsopen] = useState(false);
	const [micVolume, setMicVolume] = useState(0.5);
	const [fdforward, setfDforward] = useState(false);
	const [fdbackward, setfDbackward] = useState(false);
	const [voiceAcitce, setVoiceActice] = useState(false);
	const setTimeoutRef = useRef(null);
	const [record, setRecord] = useState(false);
	const recordedChunks = useRef([]);
	const downloadLink = useRef()
	const instanceRef = useRef();
	const { user } = useSelector(store => store.user);
	const [chatMessage, setChatMessage] = useState('');
	const [chatOpen, setChatOpen] = useState(false);
	const [unread, setUnread] = useState(0);

	// console.log(dbackward,dforward)


	const dispatch = useDispatch();

	const { ownerJoin, ownerLeft, micOn, playSong, pauseSong, changeValume, SwitchOn, handleShare, requests, peersRef, sduration, remaining, progress, handleProgressChange, setProgress, playFilter, pauseFilter, changeFilterValume, fprogress, fremaining, fduration, changeMicValume, voiceComing, filterStreamloading, songStreamloading, recordMediaRef, recordReady, continuePlay, setContinuePlay, repeatPlaylist, setRepeatPlaylist, handleSendMessage, messageList, songBase, filterBase } = useSocket(setSongPlaying, songPlaying, selectPlayListSong, selectedSong, setSeletedSong, volume, micVolume, filterPlaying, chatMessage, setChatMessage, setUnread, chatOpen);

	// console.info('voiceAcitce',voiceAcitce);

	useEffect(() => {
		function callback(status) {
			setTimeoutRef.current = setTimeout(() => {
				setVoiceActice(voiceComing);
				setTimeoutRef.current = null;
			}, 150);
		}

		if (setTimeoutRef.current == null) {
			callback(voiceComing);
		}

		if (micOn == false) {
			setVoiceActice(false);
		}
	}, [voiceComing]);


	useEffect(() => {
		if (peersRef) {
			if (Object.keys(peersRef).length < 1000) {
				setListners(Object.keys(peersRef).length);
			} else {
				setListners(`${Object.keys(peersRef).length / 1000}k`)
			}
		}
	}, [peersRef])


	useEffect(() => {
		if (query) {
			setFiltersongs(prev => {
				return allsongs.filter(song => song.title.toLowerCase().includes(query.toLowerCase()) || song.artist?.toLowerCase()?.includes(query.toLowerCase()) || song.album?.toLowerCase().includes(query.toLowerCase()));
			});
		} else {
			setFiltersongs(allsongs);
		}
	}, [query]);

	// console.log('requests list',requests)

	// useEffect(() => {
	// 	console.log('before play');
	// 	if(selectedSong.audio){
	// 		console.info('play')
	// 		playSong(selectedSong.audio);
	// 	}
	// },[selectedSong]);

	function getHistory() {
		let history = window.localStorage.getItem('history');
		if (!history) {
			window.localStorage.setItem('history', '[]');
			history = window.localStorage.getItem('history');
		}
		// console.info('history',history)
		const parseQue = JSON.parse(history);
		setQue(organizeHistoryByDate(parseQue));
		console.log('history by dates', Object.keys(organizeHistoryByDate(parseQue)))

	}

	function setHistory(data) {
		const date = new Date();
		const hour = date.getHours();
		const min = date.getMinutes();
		const sec = date.getSeconds();
		data.time = `${hour}:${min}:${sec}`;
		data.createdAt = new Date(Date.now())
		const history = window.localStorage.getItem('history');
		let parseQue = JSON.parse(history);
		parseQue = [data, ...parseQue];
		let stringifyQue = JSON.stringify(parseQue);
		window.localStorage.setItem('history', stringifyQue);
		getHistory();
	}

	useEffect(() => {
		getHistory();
	}, [])




	const handleVolumeChange = (e) => {
		const value = e.target.value;
		changeValume(value);
		setVolume(value);
	}


	useEffect(() => {
		(
			async function () {
				try {
					const { data } = await axios.get('/api/v1/temp-playlist');
					setPlaylists(data?.playlists);
					const { data: mdata } = await axios.get('/api/v1/announcement');
					if (mdata?.announcement) {
						setMessage(mdata?.announcement?.message);
					}

					const { data: sdata } = await axios.get('/api/v1/song');
					console.log('sdata', sdata)
					setAllSongs(sdata.songs);
					setFiltersongs(sdata.songs);


					const { data: fdata } = await axios.get('/api/v1/filter');
					setEffectSong(fdata.filter);
					setFilterSearch(fdata.filter);

				} catch (err) {
					console.log(err?.response?.data?.message);
				}
			}
		)()
	}, []);


	const handlePlaylist = (data) => {
		// setSelectPlayListSong(data.songs);
		setSelectPlayListSong(data);
		setOpen(true);
		setDforward(true);
		setDbackward(true);
		// console.log(data);
	}

	const handleStart = () => {
		if (!start) {
			setTimerStart(true);
			setStart(true);
			ownerJoin();

			console.log('handle start')
		} else {
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
		setProgress(0);
		playSong(data.audio, volume);
		// setQue(prev => [data,...prev]);
		setHistory(data);
	}

	const handleSongPlay = () => {
		if (songPlaying) {
			setSongPlaying(false);
			pauseSong();
		} else {
			setSongPlaying(true);
			playSong(selectedSong.audio, volume);
		}
	}


	const handleMessageSubmit = async (e) => {
		e.preventDefault();
		try {
			const { data } = await axios.post('/api/v1/announcement', { message });
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

		reader.onload = function () {
			if (reader.readyState == 2) {
				const base64String = reader.result;
				const extention = file.name.split('.').reverse()[0]
				const title = file.name.split('.')[0];

				const audio = new Audio(base64String);
				audio.addEventListener('loadedmetadata', async function () {
					// console.log('duration',audio.duration);
					try {
						const { data } = await axios.post('/api/v1/song', { audioEx: extention, coverEx: '', title, description: 'description', artist: 'unknown', size: file.size, type: file.type, cover: '/upload/cover/default.jpg', audio: base64String, duration: audio.duration, isUploadfromlive: true, playlisttitle: playlists[0]?.title }, {
							onUploadProgress: (ProgressEvent) => {
								const progress = Math.round((ProgressEvent.loaded * 100) / ProgressEvent.total);
								setFileLoad(progress);
							}
						});
						setFileLoad(0);
						setPlaylists(prev => {
							prev[0].songs.push(data?.song)
							return prev
						});
						handleSelectedSong(data.song);
						console.log(data.song);
					} catch (err) {
						console.log(err)
					}
				})
			}
		}

		reader.readAsDataURL(file);
	}


	function handleBackword() {
		const sindex = selectPlayListSong?.songs?.indexOf(selectedSong);
		console.log(sindex)
		if (sindex === 0 || sindex === undefined) {
			return
		}

		console.log(sindex)
		const song = selectPlayListSong?.songs[sindex - 1];
		handleSelectedSong(song);
	}

	function handleForward() {
		const sindex = selectPlayListSong?.songs?.indexOf(selectedSong);
		console.log(sindex, selectPlayListSong?.songs?.length - 1)
		if (sindex >= selectPlayListSong?.songs?.length - 1) return


		console.log(sindex)
		const song = selectPlayListSong?.songs[sindex + 1];
		handleSelectedSong(song);
	}

	useEffect(() => {
		if (Object.keys(selectedSong).length != 0 && Object.keys(selectPlayListSong).length != 0) {
			const sindex = selectPlayListSong?.songs?.indexOf(selectedSong);
			if (sindex === -1) {
				setDbackward(false);
				setDforward(false);
			} else {
				if (sindex === 0) {
					setDbackward(false);
				} else {
					setDbackward(true);
				}

				if (sindex >= selectPlayListSong?.songs?.length - 1) {
					setDforward(false);
				} else {
					setDforward(true);
				}
			}
		} else {
			setDforward(false);
			setDbackward(false)
		}
	}, [selectedSong])



	const handleSelectFilter = async (data) => {
		setSelectedFilter(data);
		setFilterPlaying(true);
	}

	useEffect(() => {
		if (selectedFilter.audio) {
			playFilter(selectedFilter.audio, filtervolume);
		} else {
			console.info('ni aaaya ha abhi filter')
		}
	}, [selectedFilter])

	const handleFilterSongPlay = () => {
		if (filterPlaying) {
			setFilterPlaying(false);
			pauseFilter();
		} else {
			setFilterPlaying(true);
			playFilter(selectedFilter.audio, filtervolume);
		}
	}

	const handleFilterVolumeChange = (e) => {
		setFilterVolume(e.target.value);
		changeFilterValume(e.target.value);
	}

	const handleFilterUpload = (e) => {
		const [file] = e.target.files;

		const reader = new FileReader();

		reader.onload = function () {
			if (reader.readyState == 2) {
				const base64String = reader.result;
				const extention = file.name.split('.').reverse()[0]
				const title = file.name.split('.')[0];

				const audio = new Audio(base64String);
				audio.addEventListener('loadedmetadata', async function () {
					// console.log('duration',audio.duration);
					try {
						const { data } = await axios.post('/api/v1/filter', { audioEx: extention, title, size: file.size, type: file.type, audio: base64String, duration: audio.duration }, {
							onUploadProgress: (ProgressEvent) => {
								const progress = Math.round((ProgressEvent.loaded * 100) / ProgressEvent.total);
								setFilterload(progress);
							}
						});
						setFilterload(0);
						setEffectSong(prev => [...prev, data.filter])
						handleSelectFilter(data.filter);
						console.log(data.filter);
					} catch (err) {
						setFilterload(0)
						console.log(err)
					}
				})
			}
		}

		reader.readAsDataURL(file);
	}


	useEffect(() => {
		if (filterQuery) {
			setFilterSearch(prev => effectsong.filter(f => f.title.toLowerCase().includes(filterQuery.toLowerCase())))
		} else {
			setFilterSearch(effectsong);
		}
	}, [filterQuery])



	const handleMicVolumeChange = (e) => {
		// console.log('handleMicVolumeChange',e.target.value)
		setMicVolume(e.target.value);
		changeMicValume(e.target.value);
	}


	useEffect(() => {
		if (selectedFilter) {
			const sindex = effectsong.indexOf(selectedFilter);
			if (sindex == 0) {
				setfDbackward(false);
			} else {
				setfDbackward(true);
			}

			if (sindex >= effectsong.length - 1) {
				setfDforward(false);
			} else {
				setfDforward(true);
			}
		} else {
			setfDforward(false);
			setfDbackward(false);
		}
	}, [selectedFilter])


	const handlefilterForward = () => {
		const sindex = effectsong.indexOf(selectedFilter);
		if (effectsong.length - 1 <= sindex) return
		const effect = effectsong[sindex + 1];
		handleSelectFilter(effect)
	}

	const handlefilterBackword = () => {
		const sindex = effectsong.indexOf(selectedFilter);
		if (sindex == 0) return
		const effect = effectsong[sindex - 1];
		handleSelectFilter(effect)

	}


	function startRecording() {
		recordMediaRef.current.start();
		recordMediaRef.current.ondataavailable = (e) => {
			recordedChunks.current.push(e.data);
		};

		recordMediaRef.current.onstop = (e) => {
			if (instanceRef.current) {
				startRecording();
				return
			}
			const blob = new Blob(recordedChunks.current, { type: "audio/ogg; codecs=opus" });
			recordedChunks.current = [];
			const url = URL.createObjectURL(blob);
			downloadLink.current.href = url;
			downloadLink.current.download = 'live_session.mp3';
			downloadLink.current.click();

		}
	}



	async function stopRecording() {
		recordMediaRef.current.stop();
	}

	useEffect(() => {
		instanceRef.current = record;
	}, [record])

	const handleRecord = async () => {
		if (record) {
			setRecord(false);
			stopRecording();
		} else {
			await startRecording();
			setRecord(true);
		}
	}



	const handleDeleteFromPlaylist = (data) => {

		let index = 0;
		const song = selectPlayListSong.songs.find((s, i) => {
			if (data._id.toString() === s._id.toString()) {
				index = i;
			}
			return data._id.toString() === s._id.toString();
		})

		let clone = JSON.parse(JSON.stringify(selectPlayListSong.songs));



		clone.splice(index, 1);
		setSelectPlayListSong({ ...selectPlayListSong, songs: clone })

		setPlaylists(prev => {
			let index = 0;
			prev.forEach((data, i) => {
				if (data._id.toString() === selectPlayListSong._id.toString()) {
					index = i
				}
			})
			prev[index].songs = clone;
			return prev
		})

	}


	const handleAddPlaylist = (data) => {
		let clone = JSON.parse(JSON.stringify(selectPlayListSong.songs));
		clone.push(data);
		setSelectPlayListSong({ ...selectPlayListSong, songs: clone })

		setPlaylists(prev => {
			let index = 0;
			prev.forEach((data, i) => {
				if (data._id.toString() === selectPlayListSong._id.toString()) {
					index = i
				}
			})
			prev[index].songs = clone;
			return prev
		})
	}

	function handleOnDragEnd(result) {
		if (!result.destination) return;

		const items = Array.from(selectPlayListSong.songs);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		setSelectPlayListSong({ ...selectPlayListSong, songs: items });
		setPlaylists(prev => {
			let index = 0;
			prev.forEach((data, i) => {
				if (data._id.toString() === selectPlayListSong._id.toString()) {
					index = i
				}
			})
			prev[index].songs = items;
			return prev
		})
	}

	return (
		<>
			<section className="w-full py-5 px-4 reletive">
				<a className="hidden" ref={downloadLink}></a>
				<div className='relative w-full'>
					<div className="m-auto p-4 max-w-[40rem] flex items-center justify-center gap-3 mb-5">
						<div className="border-b-2 border-indigo-600">
							<h3 className="text-3xl text-gray-600 scrolling-text-container" style={{ maxWidth: "50rem" }}><p className="scrolling-text">{message}</p></h3>
						</div>
						<button onClick={() => setMEdit(true)} className="bg-none outline-none border-none text-green-400 hover:text-green-500"><MdModeEdit size={20} /></button>
					</div>

					<div className='absolute right-0 top-0'>
						<button className='bg-indigo-500 border-none py-2 px-4 rounded-md outline-none text-white disabled:cursor-[not-allowed] disabled:bg-indigo-200 cursor-pointer disabled:text-gray-200n relative' onClick={() => { setChatOpen(true); setUnread(0) }}>Live Chat
							{unread != 0 && <span className='absolute top-[-.5rem] right-[-.5rem] w-6 h-6 grid place-items-center text-sm rounded-full bg-red-600 text-white'>{unread > 9 ? '9+' : unread}</span>}
						</button>
					</div>
				</div>


				<div className="w-full reletive px-2">
					<div className="m-auto w-full grid grid-cols-3 gap-3 flex-wrap rounded-md bg-indigo-600">

						<div className="w-full reletive bg-indigo-600 p-2 rounded-md">
							<h2 className="text-white text-lg mb-1">Microphone Volume</h2>
							<input type="range" className="w-full cursor-pointer" min={0} max={1} value={micVolume} step="0.1" onChange={handleMicVolumeChange} />

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

						<div className="w-full reletive p-2">
							<h2 className="text-white text-lg mb-1">Deck A Volume</h2>
							<input type="range" className="w-full cursor-pointer" min={0} max={0.5} value={volume} step="0.05" onChange={handleVolumeChange} />

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

						<div className="w-full reletive p-2">
							<h2 className="text-white text-lg mb-1">Deck B Volume</h2>
							<input type="range" className="w-full cursor-pointer" min={0} max={0.5} value={filtervolume} step="0.05" onChange={handleFilterVolumeChange} />

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
				</div>

				<div className="w-full flex">
					<div className="side-box flex-1 p-2 reletive">
						<div className="w-full">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between">
								<h2 className="text-white text-xl text-center">Streaming Time</h2>
								<Timer timerStart={timerStart} />
							</div>
							<div className="py-2 rounded-b-md flex justify-center shadow-md">
								<div className="flex flex-col items-center gap-3">
									<button onClick={handleStart} className={`bg-none outline-none border-none ${start ? 'text-green-400' : 'text-red-600'}`}><LuPower size={40} /></button>

									<span className="text-black text-2xl">{start ? 'ON' : "OFF"}</span>
								</div>
							</div>
						</div>

						<div className="w-full shadow-md rounded-md mt-5 border border-gray-100">



							<div className="p-3 pt-0">
								<div className="flex justify-center mt-5">
									<div className="flex flex-col items-center gap-3">

										<button className="bg-none outline-none border-none text-black" onClick={SwitchOn}>
											{
												micOn && voiceAcitce ? <BsSoundwave size={40} />
													: micOn ? <IoMdMic size={40} />
														: <IoMdMicOff size={40} />
											}
										</button>

										<span className="text-black text-2xl">{micOn ? 'Mute' : "Unmute"}</span>
									</div>
								</div>

								<div className="flex justify-center mt-5">
									<div className="flex flex-col items-center gap-3">
										<button className="bg-none outline-none border-none text-black" onClick={handleShare}>
											<IoMdShare size={40} />
										</button>
										<span className="text-black text-2xl">Share Link</span>
									</div>
								</div>

								<div className="flex justify-center mt-5">
									<div className="flex flex-col items-center gap-3">
										<button disabled={!recordReady} onClick={handleRecord} className="bg-indigo-600 disabled:opacity-50 outline-none border-none text-2xl py-2 px-4 rounded-md text-white" title="record live stream">
											{record ? <Timer timerStart={record} /> : 'Record'}
										</button>

									</div>
								</div>

							</div>
						</div>

						<div className="w-full shadow-md rounded-md mt-5 border border-gray-100 h-[40vh]" id="history">
							<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
								<h3 className="text-xl text-white">History</h3>
								<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => window.print()}>Print</button>
							</div>


							<div className="p-2 overflow-y-auto h-[70%]">
								{
									Object.keys(que).length != 0 && Object.keys(que)?.map((date) => (
										<>
											{
												que[date]?.length != 0 &&
												<time className="text-gray-400 text-xl mb-3">{date}</time>
											}
											{
												que[date]?.map((data, index) => (
													<div className="w-full p-1 my-2 border-b border-gray-100">
														<div className="flex justify-between items-center">
															<span className="text-black text-lg ml-3">{index + 1}</span>
															<div className="flex items-center gap-4">
																<time className="text-black">{data?.time}</time>

																<h2 className="text-black">{data?.title?.slice(0, 20)}</h2>
																<time className="text-black">{Math.floor(data?.duration / 60)}:{Math.floor(data?.duration % 60)}</time>
															</div>

															<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => { handleSelectedSong(data); setDforward(false); setDbackward(false) }}><FaPlay size={20} /></button>
														</div>
													</div>
												))
											}
										</>
									))
								}
							</div>

						</div>


						<div className="w-full shadow-md rounded-md mt-5 border border-gray-100 h-[40vh]">
							<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
								<h3 className="text-xl text-white">Requests</h3>
								<h3 className="text-white text-sm">{listners} Listening</h3>
							</div>
							<div className="p-2 overflow-y-auto h-[70%]">
								{
									requests?.length != 0 && requests.map((data) => (
										<div className="w-full p-1 my-2 border-b border-gray-100">
											<h4 className="text-sm text-gray-300">{data?.name} requested</h4>
											<div className="flex justify-between items-center my-2">
												<div className="flex items-center gap-4">
													<Image src={data?.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
													<h2 className="text-black">{data?.title?.slice(0, 20)}</h2>
												</div>

												<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => { handleSelectedSong(data); setDforward(false); setDbackward(false) }}><FaPlay size={20} /></button>
											</div>
										</div>
									))
								}

							</div>
						</div>
					</div>

					<div className="side-box-right w-[30rem] p-2 reletive">
						{selectedSong?.title &&
							<div className="w-full mb-5">
								<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
									<h2 className="text-white text-xl text-center">Deck A</h2>

									<div className='flex flex-col gap-3'>
										<div className='flex items-center'>
											<input type='checkbox' onChange={(e) => setContinuePlay(prev => !prev)} checked={continuePlay} />
											<p className='text-white text-sm ml-2'>Continous Play</p>
										</div>
										<div className='flex items-center'>
											<input type='checkbox' checked={repeatPlaylist} onChange={() => setRepeatPlaylist(prev => !prev)} />
											<p className='text-white text-sm ml-2'>Repeat Playlist</p>
										</div>
									</div>

								</div>
								<div className="py-2 rounded-b-md shadow-md p-3">
									<div className="flex">
										<Image src={selectedSong?.cover} width={200} height={200} className="w-[5rem] h-[5rem] rounded-md" />

										<div className="flex flex-col flex-1 reletive">
											<div className="flex">
												<div className="flex flex-col px-3 justify-center">
													<h2 className="text-black text-xl font-semibold">{selectedSong?.title?.slice(0, 20)}</h2>
													<p className="para">~ {selectedSong?.artist}</p>
												</div>
												<div className="flex-1 gap-4 flex justify-center items-center">
													<button className="bg-none outline-none border-none text-black cursor-pointer disabled:opacity-40" onClick={handleBackword} disabled={!dbackward}>
														<FaBackward size={20} />
													</button>

													<button disabled={songStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={handleSongPlay}>
														{songPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
													</button>

													<button className="bg-none outline-none border-none text-black cursor-pointer disabled:opacity-40" onClick={handleForward} disabled={!dforward}>
														<FaForward size={20} />
													</button>
												</div>
											</div>

											<div className="w-[100%] flex flex-col reletive px-3 py-2">
												<input type="range" className="w-[100%]" value={progress} onChange={handleProgressChange} step={1} min={0} max={sduration} />
												<div className="w-[100%] flex items-center justify-between">
													<time className="text-black text-xs">{Math.floor(remaining / 60)}:{Math.floor(remaining % 60)}</time>
													<time className="text-black text-xs">{Math.floor(sduration / 60)}:{Math.floor(sduration % 60)}</time>
												</div>
											</div>
										</div>

										<div className='flex gap-1 ml-3'>

											<div className='w-1 h-full rounded-md bg-red-100 relative flex flex-col justify-end'>
												{
													songBase < 33.3
														? (
															<div className={`w-full transition-allbg-green-600 rounded-b-md`} style={{height: `${songBase}%`}}></div>
														)
														: songBase > 33.3 && songBase < 66.6 ?
															(
																<>
																	<div className={`w-full transition-all bg-yellow-600`} style={{height: `${songBase-33.3}%`}}></div>
																	<div className={`w-full transition-all bg-green-600 rounded-b-md`} style={{height: `33.3%`}}></div>
																</>
															)
															: songBase > 66.6 ?
																(
																	<>
																		<div className={`w-full transition-all bg-red-600 rounded-t-md`} style={{height: `${songBase - 66.6}%`}}></div>
																		<div className={`w-full transition-all h-[${33.3}%] bg-yellow-600`} style={{height: `${33.3}%`}}></div>
																		<div className={`w-full transition-all h-[33.3%] bg-green-600 rounded-b-md`}></div>
																	</>
																) :
																<></>

												}
											</div>
											<div className='w-2 h-full flex flex-col justify-between'>
												<span className='text-xs'>-0</span>
												<span className='text-xs'>-1</span>
												<span className='text-xs'>-3</span>
												<span className='text-xs'>-5</span>
												<span className='text-xs'>-7</span>
												<span className='text-xs'>-10</span>
												<span className='text-xs'>-15</span>
												<span className='text-xs'>-30</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						}




						<div className="w-full">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
								{/*<h2 className="text-white text-xl text-center">Playlists</h2>*/}

								<button className="bg-none flex items-center outline-none border-none text-white" onClick={() => setsopen(true)}><IoSearch size={25} /><span className="ml-2 text-white text-xl">{user?.isDJ ? 'Search DJ Playlist' : 'Search Admin Playlist'}</span></button>


								<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => document.getElementById('audio').click()}>{fileload == 0 ? 'Upload' : `${fileload}%`}</button>

								<input type="file" accept="audio/*" className="hidden" id="audio" onChange={handleUpload} />
							</div>
							<div className="rounded-b-md shadow-md p-3 px-0 h-[21rem] overflow-x-auto">
								{playlists.map(data => (
									<div className={`${selectPlayListSong?._id?.toString() === data._id.toString() ? 'bg-gray-100': ''} px-3 flex justify-between items-center my-2 py-1 border-b border-gray-100`}>
										<div className="flex items-center gap-4">
											<Image src={data?.songs[0]?.cover} width={200} height={200} alt="cover" className="w-[5rem] h-[5rem] rounded-md" />
											<div className="">
												<h2 className="text-black text-xl font-semibold">{data?.title}</h2>
												<p className="para">{data?.description}</p>
											</div>
										</div>

										<div className="mr-10">
											<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handlePlaylist(data)}><FaArrowUpRightFromSquare size={20} /></button>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>


					<div className="side-box-right w-[30rem] p-2 reletive">
						{selectedFilter?.title &&
							<div className="w-full mb-5">
								<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
									<h2 className="text-white text-xl text-center">Deck B</h2>

								</div>
								<div className="py-2 rounded-b-md shadow-md p-3">
									<div className="flex">
										<Image src={selectedFilter?.cover} width={200} height={200} className="w-[5rem] h-[5rem] rounded-md" />

										<div className="flex flex-col flex-1 reletive">
											<div className="flex">
												<div className="flex flex-col px-3 justify-center">
													<h2 className="text-black text-xl font-semibold">{selectedFilter?.title?.slice(0, 20)}</h2>
													<p className="para">~ {selectedFilter?.artist}</p>
												</div>
												<div className="flex-1 gap-4 flex justify-center items-center">
													<button className="bg-none outline-none border-none text-black cursor-pointer disabled:opacity-40" onClick={handlefilterBackword} disabled={!fdbackward}>
														<FaBackward size={20} />
													</button>

													<button disabled={filterStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={handleFilterSongPlay}>
														{filterPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
													</button>

													<button className="bg-none outline-none border-none text-black cursor-pointer disabled:opacity-40" onClick={handlefilterForward} disabled={!fdforward}>
														<FaForward size={20} />
													</button>
												</div>
											</div>

											<div className="w-[100%] flex flex-col reletive px-3 py-2">
												<input type="range" className="w-[100%]" value={fprogress} step={1} min={0} max={fduration} />
												<div className="w-[100%] flex items-center justify-between">
													<time className="text-black text-xs">{Math.floor(fremaining / 60)}:{Math.floor(fremaining % 60)}</time>
													<time className="text-black text-xs">{Math.floor(fduration / 60)}:{Math.floor(fduration % 60)}</time>
												</div>
											</div>
										</div>

										<div className='flex gap-1 ml-3'>

											<div className='w-1 h-full rounded-md bg-red-100 relative flex flex-col justify-end'>
												{
													filterBase < 33.3
														? (
															<div className={`w-full transition-allbg-green-600 rounded-b-md`} style={{height: `${filterBase}%`}}></div>
														)
														: filterBase > 33.3 && filterBase < 66.6 ?
															(
																<>
																	<div className={`w-full transition-all bg-yellow-600`} style={{height: `${filterBase-33.3}%`}}></div>
																	<div className={`w-full transition-all bg-green-600 rounded-b-md`} style={{height: `33.3%`}}></div>
																</>
															)
															: filterBase > 66.6 ?
																(
																	<>
																		<div className={`w-full transition-all bg-red-600 rounded-t-md`} style={{height: `${filterBase - 66.6}%`}}></div>
																		<div className={`w-full transition-all h-[${33.3}%] bg-yellow-600`} style={{height: `${33.3}%`}}></div>
																		<div className={`w-full transition-all h-[33.3%] bg-green-600 rounded-b-md`}></div>
																	</>
																) :
																<></>

												}
											</div>
											<div className='w-2 h-full flex flex-col justify-between'>
												<span className='text-xs'>-0</span>
												<span className='text-xs'>-1</span>
												<span className='text-xs'>-3</span>
												<span className='text-xs'>-5</span>
												<span className='text-xs'>-7</span>
												<span className='text-xs'>-10</span>
												<span className='text-xs'>-15</span>
												<span className='text-xs'>-30</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						}




						<div className="w-full">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
								{/*<h2 className="text-white text-xl text-center">fsetsopen</h2>*/}

								<button className="bg-none flex items-center outline-none border-none text-white" onClick={() => fsetsopen(true)}><IoSearch size={25} /><span className="ml-2 text-white text-xl">{user?.isDJ ? 'Search DJ Filter' : 'Search Admin Filter'}</span></button>


								<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => document.getElementById('filter').click()}>{filterload == 0 ? 'Upload' : `${filterload}%`}</button>

								<input type="file" accept="audio/*" className="hidden" id="filter" onChange={handleFilterUpload} />
							</div>
							<div className="py-2 rounded-b-md shadow-md p-3 h-[21rem] overflow-x-auto">
								{effectsong?.map(data => (
									<div className="flex justify-between items-center my-6">
										<div className="flex items-center gap-4">
											<Image src={data.cover} width={200} height={200} alt="cover" className="h-[4rem] w-[4rem] object-conver rounded" />
											<h2 className="text-xl text-black">{data?.title}</h2>
										</div>

										<div className="mr-10">
											<button disabled={filterStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectFilter(data)}><FaPlay size={20} /></button>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>


				<Dialog open={open} onClose={() => setOpen(false)}>
					<DragDropContext onDragEnd={handleOnDragEnd}>
						<Droppable droppableId="characters">
							{(provided) => (
								<div {...provided.droppableProps} ref={provided.innerRef}>
									{
										selectPlayListSong?.songs && selectPlayListSong?.songs?.map((data, index) => (
											<Draggable key={data._id.toString()} draggableId={data._id.toString()} index={index}>
												{(provided) => (
													<div className="flex justify-between items-center my-6" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
														<div className="flex items-center gap-4">
															<span className="text-black text-2xl">{index + 1}</span>
															<Image src={data.cover} width={200} height={200} alt="cover" className="h-[6rem] w-28 object-conver rounded" />
															<h2 className="text-xl text-black">{data?.title?.slice(0, 40)}</h2>
														</div>
														<div>
															<button disabled={songStreamloading} title='delete song from playlist' className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 mr-4" onClick={() => handleDeleteFromPlaylist(data)}><MdDelete size={20} /></button>
															<button disabled={songStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data)}><FaPlay size={20} /></button>
														</div>
													</div>
												)}
											</Draggable>
										))
									}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</Dialog>



				<Dialog open={medit} onClose={() => setMEdit(false)}>
					<form onSubmit={handleMessageSubmit}>
						<div className='input-group flex flex-col gap-1 mb-6'>
							<div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<FaRegMessage size={20} className='text-gray-400' />
								<input type='text' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your email' id='message' name='message' required />
							</div>
							<div className='flex justify-center items-center'>
								<button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>Update</button>
							</div>
						</div>
					</form>
				</Dialog>



				<Dialog open={sopen} onClose={() => setsopen(false)} name={query} setName={setQuery} search={true}>
					{
						filtersongs && filtersongs.map((data) => (
							<div className="flex justify-between items-center my-6">
								<div className="flex items-center gap-4">
									<Image src={data.cover} width={200} height={200} alt="cover" className="h-[4rem] w-[4rem] object-conver rounded" />
									<div className='flex flex-col gap-0'>
										<h2 className="text-xl text-black">{data?.title}</h2>
										<p className="para">~ {data?.artist}</p>
										<p className="para">{data?.album}</p>
									</div>
								</div>

								<div className="mr-10">
									<button className="bg-none outline-none border-none text-black cursor-pointer mr-4" onClick={() => { handleAddPlaylist(data); setsopen(false); }}><MdAdd size={20} /></button>

									<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => { handleSelectedSong(data); setsopen(false); setDbackward(false); setDforward(false) }}><FaPlay size={20} /></button>
								</div>
							</div>
						))
					}
				</Dialog>


				<Dialog open={fsopen} onClose={() => fsetsopen(false)} name={filterQuery} setName={setFilterQuery} search={true}>
					{
						filterSearch && filterSearch.map((data) => (
							<div className="flex justify-between items-center my-6">
								<div className="flex items-center gap-4">
									<Image src={data.cover} width={200} height={200} alt="cover" className="h-[4rem] w-[4rem] object-conver rounded" />
									<h2 className="text-xl text-black">{data?.title}</h2>
								</div>

								<div className="mr-10">
									<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => { handleSelectFilter(data); fsetsopen(false) }}><FaPlay size={20} /></button>
								</div>
							</div>
						))
					}
				</Dialog>



				<ChatBox open={chatOpen} onClose={() => setChatOpen(false)} message={chatMessage} setMessage={setChatMessage} handleSendMessage={handleSendMessage}>
					{
						messageList.map(data => <Message {...data} />)
					}
				</ChatBox>


			</section>
		</>
	);
}