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
import { MdCall } from "react-icons/md";
import { FaFolder, FaFolderOpen } from "react-icons/fa";
import { GiLoveSong } from "react-icons/gi";
import CreatePlaylistComponets from '@/components/CreatePlaylistComponets';
import EditPlaylistComponets from '@/components/EditPlaylistComponets';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';


import { MdAlternateEmail, MdAudiotrack, MdKey } from 'react-icons/md'
import { MdOutlineSubtitles, MdDescription, MdPhoto } from 'react-icons/md';
import { FaUserAlt } from 'react-icons/fa';
import RenamePlaylistComponents from '@/components/RenamePlaylistComponents';
// import VolumePopup from '@/components/VolumePopup';
// import VolumePopupsDeck from '@/components/VolumePopupsDeck';
import AutoAdjustByBase from '@/components/AutoAdjustByBase';

function addOneMinute(hours, minutes) {
	// Split the time string into hours and minutes
	// let [hours, minutes] = time.split(':').map(Number);

	// Increment the minutes
	minutes++;

	// If minutes exceed 59, adjust hours and minutes
	if (minutes > 59) {
		hours++;
		minutes = 0;
	}

	// If hours exceed 23, reset to 00
	if (hours > 23) {
		hours = 0;
	}

	// Format hours and minutes to have leading zeros if necessary
	hours = +hours;
	minutes = +minutes;

	// Return the result
	return [hours, minutes];
}

function checkInTimeRangeForDay(startTime, endTime, user) {
	let currentHour = new Date().getUTCHours();
	let currentMinute = new Date().getUTCMinutes();
	[currentHour, currentMinute] = addOneMinute(currentHour, currentMinute);


	const rangeStartHour = +startTime?.split(':')[0];
	const rangeStartMinute = +startTime?.split(':')[1];

	const rangeEndHour = +endTime?.split(':')[0];
	const rangeEndMinute = +endTime?.split(':')[1];

	const timeInRange = (currentHour > rangeStartHour || (currentHour === rangeStartHour && currentMinute >= rangeStartMinute)) && (currentHour < rangeEndHour || (currentHour === rangeEndHour && currentMinute <= rangeEndMinute));

	const checkDay = user?.djDays?.includes((new Date().getDay()).toString())
	if (checkDay && timeInRange) {
		return true;
	} else {
		return false;
	}
	// return timeInRange;
}





const TimeRemaining = ({ user, setActive, ownerLeft, start, setStart, setTimerStart }) => {
	const [remainingTime, setRemainingTime] = useState("00:00");
	const startRef = useRef()
	const router = useRouter()

	useEffect(() => {
		startRef.current = start
	}, [start])

	useEffect(() => {
		const calculateRemainingTime = () => {
			const range = checkInTimeRangeForDay(user?.djStartTime, user?.djEndTime, user)
			setActive(range);
			if (!range) {
				setRemainingTime(`${convertUTCToLocalTime(user?.djStartTime)} to ${convertUTCToLocalTime(user?.djEndTime)}`);
				return
			}
			if (!user || !user.djStartTime || !user.djEndTime) {
				setRemainingTime("00:00");
				return;
			}

			const nowUTC = new Date();
			// Get current UTC time
			const nowUTCTimestamp = nowUTC.getTime();

			// Parse start time and end time
			const startTimeUTC = new Date();
			const endTimeUTC = new Date();

			// Adjust start time and end time to UTC
			startTimeUTC.setUTCHours(parseInt(user.djStartTime.split(':')[0]), parseInt(user.djStartTime.split(':')[1]), 0, 0);
			endTimeUTC.setUTCHours(parseInt(user.djEndTime.split(':')[0]), parseInt(user.djEndTime.split(':')[1]), 0, 0);

			// Calculate remaining time in milliseconds
			let timeDiff = endTimeUTC.getTime() - nowUTCTimestamp;

			// If current time is after end time, set remaining time to 0
			timeDiff = Math.max(0, timeDiff);

			const hours = Math.floor(timeDiff / (1000 * 60 * 60));
			const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

			// Format the remaining time
			const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

			if (formattedTime == "00:00:00") {
				toast.info(`Your times is up ${startRef.current}`);
				if (startRef.current) {
					setTimerStart(false)
					ownerLeft();
					setStart();
				}
			}
			setRemainingTime(formattedTime);
		};

		const interval = setInterval(calculateRemainingTime, 1000); // Update every second

		return () => clearInterval(interval);
	}, [user]);

	return (
		<h2 className="text-white text-xl text-center">{remainingTime}</h2>
	);
}



const CustomContextMenu = ({ xPos, yPos, clickedData, handleDelete, setCreatePlaylistOpen, setEditPlaylistOpen, setRenameOpen }) => {
	return (
		<>
			{
				xPos != 0 && yPos != 0 &&
				<div
					style={{
						position: 'fixed',
						top: yPos,
						left: xPos,
						backgroundColor: 'white',

						padding: '10px',
					}}
					className='iscotext rounded-md shadow-md'
				>

					<ul className='iscotext'>
						{
							clickedData?.type != "empty" &&
							<>
								<li className='iscotext text-black/80 py-1 px-2 rounded-md hover:bg-gray-100 transition-all cursor-pointer' onClick={() => handleDelete(clickedData)}>Delete</li>
								{
									clickedData?.type == "playlist" &&
									(
										<>
											<li className='iscotext text-black/80 py-1 px-2 rounded-md hover:bg-gray-100 transition-all cursor-pointer' onClick={setEditPlaylistOpen}>Add New Song</li>
											<li className='iscotext text-black/80 py-1 px-2 rounded-md hover:bg-gray-100 transition-all cursor-pointer' onClick={() => setRenameOpen(true)}>Edit Folder</li>
										</>
									)
								}
							</>
						}
						<li className='iscotext text-black/80 py-1 px-2 rounded-md hover:bg-gray-100 transition-all cursor-pointer' onClick={() => setCreatePlaylistOpen(true)}>Create Folder</li>
					</ul>
				</div>
			}
		</>
	);
};



function RenderPlayList({ playlist, onSongDragStart, onSongDrop, handleContextMenu }) {
	const [open, setOpen] = useState(false);
	const handleDragStart = (e) => {
		e.dataTransfer.setData("id", playlist._id)
		e.dataTransfer.setData("isPlaylist", true)
	}
	return (
		<div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onSongDrop(e, playlist._id)}>
			<p onClick={() => setOpen(prev => !prev)} className='text-black/90 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2' onContextMenu={(e) => handleContextMenu(e, { type: "playlist", _id: playlist._id, title: playlist.title, album: playlist.album,artist: playlist.artist  })} draggable onDragStart={handleDragStart}>
				{/* <span className='text-yellow-500'>{open ? <FaFolderOpen /> : <FaFolder />}</span> */}
				<img src={playlist.cover} width={20} height={20} className='rounded-md'/>
				{playlist.title}
			</p>
			{open &&
				<div className='flex flex-col gap-2 pl-5' >
					{
						playlist?.songs?.map((song) => (
							<p className='text-black/80 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2' draggable onDragStart={(e) => onSongDragStart(e, song, playlist._id)} onContextMenu={(e) => handleContextMenu(e, { type: "song", _id: song._id, playlistId: playlist._id })}>
								<span className='text-blue-300'>{<GiLoveSong />}</span>
								{song.title}
							</p>
						))
					}
				</div>
			}
		</div>
	)
}

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

const daysObject = {
	0: "Sunday",
	1: "Monday",
	2: "Tuesday",
	3: "Wednesday",
	4: "Thursday",
	5: "Friday",
	6: "Saturday"
};

function convertUTCToLocalTime(utctime) {
	if (!utctime) {
		return
	}
	// Split the input time string into hours and minutes
	const [hourStr, minuteStr] = utctime.split(':');

	// Parse hours and minutes as integers
	const hour = parseInt(hourStr, 10);
	const minute = parseInt(minuteStr, 10);

	// Create a new Date object with UTC time
	const utcDate = new Date();
	utcDate.setUTCHours(hour);
	utcDate.setUTCMinutes(minute);

	// Format local time in 24-hour format
	const localHour = utcDate.getHours().toString().padStart(2, '0');
	const localMinute = utcDate.getMinutes().toString().padStart(2, '0');

	return `${localHour}:${localMinute}`;
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
	const [volume, setVolume] = useState(0.25);
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
	const [filtervolume, setFilterVolume] = useState(0.25);
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
	const [callers, setCallers] = useState({});
	const [nextSong, setNextSong] = useState({});
	const [allplaylists, setAllPlaylists] = useState([])
	const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
	const [clickedData, setClickedData] = useState(null);
	const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
	const [editPlaylistOpen, setEditPlaylistOpen] = useState(false);
	const [active, setActive] = useState(false);
	const [songOpen, setSongOpen] = useState(false);
	const [songTitle, setSongTitle] = useState("")
	const [songAlbum, setSognAlbum] = useState("Unkown")
	const [songArtist, setSognArtist] = useState("Unkown")
	const [size, setSize] = useState('');
	const [type, setType] = useState('');
	const [audioEx, setAudioEx] = useState('');
	const [audiofile, setAudio] = useState('');
	const [duration, setDuration] = useState(0);
	const [isaddInQue, setisaddInQue] = useState(false);
	const [renameOpen, setRenameOpen] = useState(false);
	const [showTitle, setShowTitle] = useState(false);
	const [userChangeVolume,setUserChangeVolume] = useState(false);
	// console.log(dbackward,dforward)
	

	const dispatch = useDispatch();

	const { ownerJoin, ownerLeft, micOn, playSong, pauseSong, changeValume, SwitchOn, handleShare, requests, peersRef, sduration, remaining, progress, handleProgressChange, setProgress, playFilter, pauseFilter, changeFilterValume, fprogress, fremaining, fduration, changeMicValume, voiceComing, filterStreamloading, songStreamloading, recordMediaRef, recordReady, continuePlay, setContinuePlay, repeatPlaylist, setRepeatPlaylist, handleSendMessage, messageList, songBase, filterBase, callComing, callerName, handleCallComing, callsElementRef, callerDetailsRef, handleCallCut, callDataChange } = useSocket(setSongPlaying, songPlaying, selectPlayListSong, selectedSong, setSeletedSong, volume, micVolume, filterPlaying, chatMessage, setChatMessage, setUnread, chatOpen, nextSong, setHistory,handleSelectedSong);

	// console.info('voiceAcitce',voiceAcitce);


	// callers
	useEffect(() => {
		setCallers(callerDetailsRef.current);
	}, [callerDetailsRef.current, callDataChange])

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
		const userhistoryname = `${user?.email}-history`;
		let history = window.localStorage.getItem(userhistoryname);
		if (!history) {
			window.localStorage.setItem(userhistoryname, '[]');
			history = window.localStorage.getItem(userhistoryname);
		}
		// console.info('history',history)
		const parseQue = JSON.parse(history);
		setQue(organizeHistoryByDate(parseQue));
		console.log('history by dates', Object.keys(organizeHistoryByDate(parseQue)))

	}

	function setHistory(data) {
		setSelectPlayListSong(prev => {
			let copy = JSON.parse(JSON.stringify(prev));
			copy.songs = copy.songs.filter(song => song._id.toString() != data._id.toString());

			return copy;
		})
		const userhistoryname = `${user?.email}-history`;
		const date = new Date();
		const hour = date.getHours();
		const min = date.getMinutes();
		const sec = date.getSeconds();
		data.time = `${hour}:${min}:${sec}`;
		data.createdAt = new Date(Date.now())
		const history = window.localStorage.getItem(userhistoryname);
		let parseQue = JSON.parse(history);
		parseQue = [data, ...parseQue];
		let stringifyQue = JSON.stringify(parseQue);
		window.localStorage.setItem(userhistoryname, stringifyQue);
		getHistory();
	}

	useEffect(() => {
		if (user) {
			getHistory();
		}
	}, [user])




	const handleVolumeChange = (e) => {
		setUserChangeVolume(true);
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
					// setSelectPlayListSong(data?.playlists[0]);
					setSelectPlayListSong({ songs: [] });
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


					const { data: all } = await axios.get('/api/v1/playlist');
					setAllPlaylists(all?.playlists);

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


	function handleSelectedSong (data, index) {
		setSeletedSong(data);
		setOpen(false);
		setSongPlaying(true);
		setProgress(0);
		playSong(data.audio, volume);
		setUserChangeVolume(false);
		// setQue(prev => [data,...prev]);
		setHistory(data);
		if (selectPlayListSong.songs.length - 1 <= index) {
			console.log(selectPlayListSong.songs[0])
			setNextSong(selectPlayListSong.songs[0]);
		} else {
			console.log(selectPlayListSong.songs[index + 1])
			setNextSong(selectPlayListSong.songs[index + 1]);
		}


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


	const handleSongSubmit = async (e, addInQue,songTitle,size,type,audioEx,duration,audiofile) => {


		e?.preventDefault();
		

		if (!audiofile) {
			await dispatch(showError("Please fill all the fields"));
			await dispatch(clearError());
		}




		try {
			const { data } = await axios.post('/api/v1/song', { audioEx, coverEx: '', title: songTitle, description: "", artist: "Unknown", size, type, audio: audiofile, duration, album: "Unknown", cover: '/upload/cover/default.jpg' }, {
				onUploadProgress: (ProgressEvent) => {
					const progress = Math.round((ProgressEvent.loaded * 100) / ProgressEvent.total);
					if (progress > 7) {

						setFileLoad(progress - 1);
					} else {
						setFileLoad(progress);
					}
				}
			});
			const { data: sdata } = await axios.get('/api/v1/song');
			setAllSongs(sdata.songs);
			if (addInQue) {
				setSelectPlayListSong({ ...selectPlayListSong, songs: [...selectPlayListSong.songs, data?.song] })
			}

			setFileLoad(100);
			// setSongTitle('');
			// setSognArtist('');
			e?.target.reset();
			setAudio('');
			await dispatch(showMessage(data.message));
			await dispatch(clearMessage());

		} catch (error) {
			console.log(error.message)
			await dispatch(showError(error.response.data.message));
			await dispatch(clearError());
		}
		setFileLoad(0);
		setSongOpen(false)
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

		if (selectPlayListSong.songs.length - 1 <= sindex) {
			setNextSong(selectPlayListSong.songs[0])
		} else {
			setNextSong(selectPlayListSong.songs[sindex + 1])
		}
	}

	function handleForward() {
		const sindex = selectPlayListSong?.songs?.indexOf(selectedSong);
		console.log(sindex, selectPlayListSong?.songs?.length - 1)
		if (sindex >= selectPlayListSong?.songs?.length - 1) return


		console.log(sindex)
		const song = selectPlayListSong?.songs[sindex + 1];
		handleSelectedSong(song);
		if (selectPlayListSong.songs.length - 1 <= sindex + 1) {
			setNextSong(selectPlayListSong.songs[0])
		} else {
			setNextSong(selectPlayListSong.songs[sindex + 2])
		}
	}

	useEffect(() => {
		if (Object.keys(selectedSong).length != 0 && Object.keys(selectPlayListSong).length != 0) {
			const sindex = selectPlayListSong?.songs?.indexOf(selectedSong);
			console.log("I am fill",selectPlayListSong,sindex);
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
	}, [selectedSong,selectPlayListSong])



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
		console.warn('function call',e.target.value);
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

		// setPlaylists(prev => {
		// 	let index = 0;
		// 	prev.forEach((data, i) => {
		// 		if (data._id.toString() === selectPlayListSong._id.toString()) {
		// 			index = i
		// 		}
		// 	})
		// 	prev[index].songs = clone;
		// 	return prev
		// })

	}


	const handleAddPlaylist = (data) => {
		let clone = JSON.parse(JSON.stringify(selectPlayListSong.songs));
		clone.push(data);
		setSelectPlayListSong({ ...selectPlayListSong, songs: clone })

		// setPlaylists(prev => {
		// 	let index = 0;
		// 	prev.forEach((data, i) => {
		// 		if (data._id.toString() === selectPlayListSong._id.toString()) {
		// 			index = i
		// 		}
		// 	})
		// 	prev[index].songs = clone;
		// 	return prev
		// })
	}

	function handleOnDragEnd(result) {
		if (!result.destination) return;

		const items = Array.from(selectPlayListSong.songs);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		setSelectPlayListSong({ ...selectPlayListSong, songs: items });
		// setPlaylists(prev => {
		// 	let index = 0;
		// 	prev.forEach((data, i) => {
		// 		if (data._id.toString() === selectPlayListSong._id.toString()) {
		// 			index = i
		// 		}
		// 	})
		// 	prev[index].songs = items;
		// 	return prev
		// })

	}


	useEffect(() => {
		if (selectPlayListSong?.songs && selectedSong?.title) {
			const sindex = selectPlayListSong?.songs?.indexOf(selectedSong);
			if (selectPlayListSong.songs.length - 1 <= sindex) {
				setNextSong(selectPlayListSong.songs[0])
			} else {
				setNextSong(selectPlayListSong.songs[sindex + 1])
			}
		}

	}, [selectPlayListSong.songs])

	const isAllow = (permissionName) => {
		if (user?.isDJ) {
			if (user?.djPermissions.includes(permissionName)) {
				if (permissionName === 'live') {
					const isTimeRange = checkInTimeRange(user?.djStartTime, user?.djEndTime);
					return isTimeRange;
				} else {
					return true
				}
			} else {
				return false
			}
		} else {
			if (permissionName === 'playlists') {
				return false
			} else {
				return true
			}
		}
	}



	const onSongDragStart = (e, song, playlistId) => {
		console.log('start')
		e.dataTransfer.setData("song", JSON.stringify(song));
		e.dataTransfer.setData("playlistId", playlistId);
	}

	const onSongDrop = async (e, targetPlaylistId) => {
		const sourceId = e.dataTransfer.getData("playlistId")
		const song = JSON.parse(e.dataTransfer.getData("song"));
		const sourcePlaylist = allplaylists.find(playlist => playlist._id.toString() === sourceId);
		const targetPlaylist = allplaylists.find(playlist => playlist._id.toString() === targetPlaylistId.toString());

		const sourceSeletdSongs = sourcePlaylist.songs.map(song => song._id).filter(id => id.toString() != song._id);
		const targetSeletdSongs = targetPlaylist.songs.map(song => song._id);
		targetSeletdSongs.push(song._id)


		await Promise.all([axios.post(`/api/v1/playlist/${sourceId}`, { songs: sourceSeletdSongs }), axios.post(`/api/v1/playlist/${targetPlaylistId}`, { songs: targetSeletdSongs })]);
		const { data: all } = await axios.get('/api/v1/playlist');
		setAllPlaylists(all?.playlists);

	}


	const handleContextMenu = (e, data) => {
		e.stopPropagation()
		e.preventDefault();
		setContextMenuPosition({ x: e.clientX, y: e.clientY });
		setClickedData(data);
	};

	useEffect(() => {
		window.addEventListener("click", (e) => {
			const element = e.target;
			// if(element.classList)
			if (!element.classList.contains("iscotext")) setContextMenuPosition({ x: 0, y: 0 })
		}, false);
	}, [])


	const handleDelete = async (data) => {

		if (data.type == "song") {
			const sourcePlaylist = allplaylists.find(playlist => playlist._id.toString() === data.playlistId);
			const sourceSeletdSongs = sourcePlaylist.songs.map(song => song._id).filter(id => id != data._id);
			await axios.post(`/api/v1/playlist/${data.playlistId}`, { songs: sourceSeletdSongs })
		} else {
			await axios.delete(`/api/v1/playlist?id=${data._id}`);
		}
		const { data: all } = await axios.get('/api/v1/playlist');
		setAllPlaylists(all?.playlists);
	}

	const handleSongDropOnPlaylintList = (e) => {
		const isPlaylist = e.dataTransfer.getData("isPlaylist");
		if (isPlaylist) {
			const id = e.dataTransfer.getData("id");
			const sourcePlaylist = allplaylists.find(playlist => playlist._id.toString() === id);
			setSelectPlayListSong({ ...selectPlayListSong, songs: [...selectPlayListSong.songs, ...sourcePlaylist.songs] })
			return
		}
		const data = JSON.parse(e.dataTransfer.getData("song"));
		handleAddPlaylist(data)
	}


	const getPlaylist = async () => {
		const { data: all } = await axios.get('/api/v1/playlist');
		setAllPlaylists(all?.playlists);
	}


	const fileToBase64 = (e, setState, setEx) => {
		const [file] = e.target.files;

		const reader = new FileReader();

		reader.onload = function () {
			if (reader.readyState == 2) {
				const base64String = reader.result;
				setSize(file.size);
				setType(file.type);
				setState(base64String);
				const extention = file.name.split('.').reverse()[0]
				setSongTitle(file.name)
				setEx(extention);
				console.log(songTitle,"song")
				const audio = new Audio(base64String);
				audio.addEventListener('loadedmetadata', function () {
					setDuration(audio.duration);
					handleSongSubmit(undefined,isaddInQue,file.name,file.size,file.type,extention,audio.duration,base64String);
				})
			}
		}

		reader.readAsDataURL(file);
	}



	const handleAddQue = (song) => {
		setSelectPlayListSong({ ...selectPlayListSong, songs: [...selectPlayListSong.songs, song] });
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

						<div className="w-full relative bg-indigo-600 p-2 rounded-md">
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

							<div className="w-full flex items-center mt-2 px-1 relative gap-1">
								<div className='border-t-2 border-green-500 w-[34%] flex items-center justify-center'>
									<h3 className='text-md text-green-500'>low</h3>
								</div>
								<div className='border-t-2 border-yellow-500 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-yellow-500'>medium</h3>
								</div>
								<div className='border-t-2 border-red-500 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-red-500'>good</h3>
								</div>
								<div className='border-t-2 border-red-900 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-red-900'>high</h3>
								</div>
							</div>

							{/* <VolumePopup deckname={'Microphone'} volume={micVolume} handleMicVolumeChange={handleMicVolumeChange}/> */}
						</div>

						<div className="w-full relative p-2">
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

							<div className="w-full flex items-center mt-2 px-1 relative gap-1">
								<div className='border-t-2 border-green-500 w-[34%] flex items-center justify-center'>
									<h3 className='text-md text-green-500'>low</h3>
								</div>
								<div className='border-t-2 border-yellow-500 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-yellow-500'>medium</h3>
								</div>
								<div className='border-t-2 border-red-500 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-red-500'>good</h3>
								</div>
								<div className='border-t-2 border-red-900 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-red-900'>high</h3>
								</div>
							</div>

							{/* <VolumePopupsDeck deckname={'Deck A'} volume={volume} handleMicVolumeChange={handleVolumeChange}/> */}
							<AutoAdjustByBase songPlaying={songPlaying} songBase={songBase} handleVolumeChange={changeValume} userChangeVolume={userChangeVolume}/>
							
						</div>

						<div className="w-full relative p-2">
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
							<div className="w-full flex items-center mt-2 px-1 relative gap-1">
								<div className='border-t-2 border-green-500 w-[34%] flex items-center justify-center'>
									<h3 className='text-md text-green-500'>low</h3>
								</div>
								<div className='border-t-2 border-yellow-500 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-yellow-500'>medium</h3>
								</div>
								<div className='border-t-2 border-red-500 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-red-500'>good</h3>
								</div>
								<div className='border-t-2 border-red-900 w-[21%] flex items-center justify-center'>
									<h3 className='text-md text-red-900'>high</h3>
								</div>
							</div>

							{/* <VolumePopupsDeck deckname={'Deck B'} volume={filtervolume} handleMicVolumeChange={handleFilterVolumeChange}/> */}
						</div>

					</div>
				</div>

				<div className="w-full flex">
					<div className="side-box flex-1 p-2 reletive">
						<div className="w-full">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between">
								<div>
									<h2 className="text-white text-lg text-center">Streaming Time</h2>
									<Timer timerStart={timerStart} />
								</div>


								{
									user?.isDJ &&
									<div>

										<>

											<h2 className="text-white text-lg text-center">
												{
													!active ? "Schedule Time" : "Remaining Time"
												}

											</h2>
											<TimeRemaining user={user} setTimerStart={setTimerStart} setActive={setActive} ownerLeft={ownerLeft} start={start} setStart={setStart} />
										</>


									</div>
								}

							</div>
							<div className="py-2 rounded-b-md flex justify-around items-center shadow-md">
								<h3 className="text-black text-xl text-center">{listners}
									<br />
									Listeners
								</h3>
								<div className="flex flex-col items-center gap-3 relative cursor-pointer" onMouseEnter={() => setShowTitle(true)} onMouseLeave={() => setShowTitle(false)}>
									<button onClick={handleStart} className={`bg-none hover-button outline-none border-none disabled:opacity-20 ${start ? 'text-green-400' : 'text-red-600'}`} disabled={user?.isDJ && !active}><LuPower size={40} /></button>

									{
										showTitle &&
										<span className='block absolute top-0 left-[50px] w-[30rem] p-2 bg-white shadow-md rounded-md'>
											{
												user?.djTimeInDays ?
													(
														user?.djDays.includes(new Date().getDay().toString()) ?
															(
																`${daysObject[new Date().getDay().toString()]} ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`
															) :
															(
																`${user?.djDays?.map((p, i) => `${i != 0 ? ' ,' : ' '} ${daysObject[p]} ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`)}`
															)

													)
													:
													(`${user?.djDate} / ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`)
											}
											{/* {user?.djTimeInDays ? `${user?.djDays?.map((p, i) => `${i != 0 ? ' ,' : ' '} ${daysObject[p]} ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`)}` : `${user?.djDate} / ${convertUTCToLocalTime(user?.djStartTime)}-${convertUTCToLocalTime(user?.djEndTime)}`} */}
										</span>
									}

									<span className="text-black text-2xl">{start ? 'ON' : "OFF"}</span>
								</div>
							</div>
						</div>

						<div className="w-full shadow-md rounded-md mt-5 border border-gray-100">



							<div className="p-3 pt-0">
								<div className='flex items-center justify-evenly'>

									<div className="flex justify-center mt-5">
										<div className="flex flex-col items-center gap-3">

											<button className="bg-none outline-none border-none text-black" onClick={SwitchOn}>
												{
													micOn && voiceAcitce ? <BsSoundwave size={40} />
														: micOn ? <IoMdMic size={40} />
															: <IoMdMicOff size={40} />
												}
											</button>

											<span className="text-black text-lg">{micOn ? 'Mute' : "Unmute"}</span>
										</div>
									</div>

									<div className="flex justify-center mt-5">
										<div className="flex flex-col items-center gap-3">
											<button className="bg-none outline-none border-none text-black" onClick={handleShare}>
												<IoMdShare size={40} />
											</button>
											<span className="text-black text-lg">Copy Link</span>
										</div>
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


						<div className="w-full mt-5">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">


								<button className="bg-none flex items-center outline-none border-none text-white" onClick={() => fsetsopen(true)}><IoSearch size={25} /><span className="ml-2 text-white text-xl">{user?.isDJ ? 'Search DJ Filter' : 'Search Admin Filter'}</span></button>

								{
									isAllow('songs') &&
									<>
										<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => document.getElementById('filter').click()}>{filterload == 0 ? 'Upload' : `${filterload}%`}</button>

										<input type="file" accept="audio/*" className="hidden" id="filter" onChange={handleFilterUpload} />
									</>
								}

							</div>
							<h2 className='text-black/90 my-2 text-center text-2xl'>Sound FX</h2>
							<div className="py-2 rounded-b-md shadow-md p-3 h-[15.5rem] overflow-x-auto">
								{effectsong?.map(data => (
									<div className="flex justify-between items-center my-6">
										<div className="flex items-center gap-4">
											<Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
											<h2 className="text-xl text-black">{data?.title}</h2>
										</div>

										<div className="mr-10">
											<button disabled={filterStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectFilter(data)}><FaPlay size={20} /></button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* <div className="w-full shadow-md rounded-md mt-5 border border-gray-100 h-[40vh]" id="history">
							<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
								<h3 className="text-xl text-white">Playlists</h3>
								<button className="bg-none flex items-center outline-none border-none text-white" onClick={() => setsopen(true)}><IoSearch size={25} /></button>
							</div>


							<div className="p-2 overflow-y-auto h-[80%] flex flex-col gap-3" onContextMenu={(e) => handleContextMenu(e, {type: "empty"})}>
								{
									allplaylists.length != 0 && allplaylists?.map((data) => (
										<RenderPlayList playlist={data} onSongDragStart={onSongDragStart} onSongDrop={onSongDrop} handleContextMenu={handleContextMenu}/>
									))
								}
							</div>

						</div> */}

						<div className="w-full shadow-md rounded-md mt-5 border border-gray-100 h-[40vh]">
							<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
								<h3 className="text-xl text-white">Requests</h3>

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
									<div>
										<h2 className="text-white text-xl text-left">Deck A</h2>
										<div className='flex items-center gap-3'>
											<h6 className='text-white text-sm'>Remainning</h6>
											<time className="text-white text-sm">{Math.floor(remaining / 60)}:{Math.floor(remaining % 60)}</time>
										</div>
									</div>

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
													<p className="para text-xs">~ {selectedSong?.artist} - {selectedSong?.album}</p>
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
															<div className={`w-full transition-allbg-green-600 rounded-b-md`} style={{ height: `${songBase}%` }}></div>
														)
														: songBase > 33.3 && songBase < 66.6 ?
															(
																<>
																	<div className={`w-full transition-all bg-yellow-600`} style={{ height: `${songBase - 33.3}%` }}></div>
																	<div className={`w-full transition-all bg-green-600 rounded-b-md`} style={{ height: `33.3%` }}></div>
																</>
															)
															: songBase > 66.6 ?
																(
																	<>
																		<div className={`w-full transition-all bg-red-600 rounded-t-md`} style={{ height: `${songBase - 66.6}%` }}></div>
																		<div className={`w-full transition-all h-[${33.3}%] bg-yellow-600`} style={{ height: `${33.3}%` }}></div>
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
							<div className="bg-indigo-600 p-3 rounded-t-md ">
								{/*<h2 className="text-white text-xl text-center">Playlists</h2>*/}

								<div className='flex justify-between reletive items-center'>

									{/* <button className="bg-none flex items-center outline-none border-none text-white" onClick={() => setsopen(true)}><IoSearch size={25} /><span className="ml-2 text-white text-xl">{user?.isDJ ? 'Search DJ Playlist' : 'Search Admin Playlist'}</span></button> */}
									<input type='file' onChange={(e) => fileToBase64(e, setAudio, setAudioEx)} className='w-[95%] outline-none ml-1' id='audio' name='audio' accept="audio/*" hidden required />
									{
										isAllow('add_song') &&
										<>
											<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => { document.getElementById("audio").click(); setisaddInQue(true) }}>{fileload != 0 && isaddInQue  ? `${fileload}%` : "Add Song"  }</button>
										</>
									}
									<h2 className='text-white my-2 text-center text-2xl'>Queue</h2>
								</div>



							</div>

							<div className="rounded-b-md shadow-md p-3 px-0 h-[19.3rem] overflow-x-auto" onDragOver={(e) => e.preventDefault()} onDrop={handleSongDropOnPlaylintList}>
								{/* {playlists.map(data => (
									<div className={`${selectPlayListSong?._id?.toString() === data._id.toString() ? 'bg-gray-100' : ''} px-3 flex justify-between items-center my-2 py-1 border-b border-gray-100`}>
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
								))} */}
								<DragDropContext onDragEnd={handleOnDragEnd}>
									<Droppable droppableId="characters">
										{(provided) => (
											<div {...provided.droppableProps} ref={provided.innerRef}>
												{
													selectPlayListSong?.songs && selectPlayListSong?.songs?.map((data, index) => (
														<Draggable key={data._id.toString()} draggableId={data._id.toString()} index={index}>
															{(provided) => (
																<div className={`flex justify-between items-center my-6 rounded-md ${data._id.toString() === nextSong?._id?.toString() ? "bg-yellow-200" : ''}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
																	<div className="flex items-center gap-4">
																		{/* <span className="text-black text-2xl">{index + 1}</span> */}
																		<Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
																		<div>
																			<h2 className="text-xl text-black">{data?.title?.slice(0, 40)}</h2>
																			<p className="para"> ~ {data?.artist} - {data?.album}</p>

																		</div>
																	</div>
																	<div>
																		<button disabled={songStreamloading} title='delete song from playlist' className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 mr-4" onClick={() => handleDeleteFromPlaylist(data)}><MdDelete size={20} /></button>
																		<button disabled={songStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data, index)}><FaPlay size={20} /></button>
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
							</div>
						</div>

						{/* <div className="w-full shadow-md rounded-md mt-5 border border-gray-100 h-[40vh]">
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
						</div> */}

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

															<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => { handleAddQue(data) }}><FaPlay size={20} /></button>
														</div>
													</div>
												))
											}
										</>
									))
								}
							</div>

						</div>


					</div>


					<div className="side-box-right w-[30rem] p-2 reletive">
						{selectedFilter?.title &&
							<div className="w-full mb-5">
								<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
									<div>
										<h2 className="text-white text-xl text-left">Deck B</h2>
										<div className='flex items-center gap-3'>
											<h6 className='text-white text-sm'>Remainning</h6>
											<time className="text-white text-sm">{Math.floor(fremaining / 60)}:{Math.floor(fremaining % 60)}</time>
										</div>
									</div>

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
															<div className={`w-full transition-allbg-green-600 rounded-b-md`} style={{ height: `${filterBase}%` }}></div>
														)
														: filterBase > 33.3 && filterBase < 66.6 ?
															(
																<>
																	<div className={`w-full transition-all bg-yellow-600`} style={{ height: `${filterBase - 33.3}%` }}></div>
																	<div className={`w-full transition-all bg-green-600 rounded-b-md`} style={{ height: `33.3%` }}></div>
																</>
															)
															: filterBase > 66.6 ?
																(
																	<>
																		<div className={`w-full transition-all bg-red-600 rounded-t-md`} style={{ height: `${filterBase - 66.6}%` }}></div>
																		<div className={`w-full transition-all h-[${33.3}%] bg-yellow-600`} style={{ height: `${33.3}%` }}></div>
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




						{/* <div className="w-full">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
								
								
								<button className="bg-none flex items-center outline-none border-none text-white" onClick={() => fsetsopen(true)}><IoSearch size={25} /><span className="ml-2 text-white text-xl">{user?.isDJ ? 'Search DJ Filter' : 'Search Admin Filter'}</span></button>

								{
									isAllow('songs') &&
									<>
										<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => document.getElementById('filter').click()}>{filterload == 0 ? 'Upload' : `${filterload}%`}</button>

										<input type="file" accept="audio/*" className="hidden" id="filter" onChange={handleFilterUpload} />
									</>
								}

							</div>
							<h2 className='text-black/90 my-2 text-center text-2xl'>Sound FX</h2>
							<div className="py-2 rounded-b-md shadow-md p-3 h-[21rem] overflow-x-auto">
								{effectsong?.map(data => (
									<div className="flex justify-between items-center my-6">
										<div className="flex items-center gap-4">
											<Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
											<h2 className="text-xl text-black">{data?.title}</h2>
										</div>

										<div className="mr-10">
											<button disabled={filterStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectFilter(data)}><FaPlay size={20} /></button>
										</div>
									</div>
								))}
							</div>
						</div> */}


						<div className="w-full shadow-md rounded-md border border-gray-100 h-[40vh]" id="history">
							<div className="w-full bg-indigo-600 px-2 py-4 flex justify-between items-center rounded-t-md">
								<h3 className="text-xl text-white">Playlists</h3>
								<input type='file' onChange={(e) => fileToBase64(e, setAudio, setAudioEx)} className='w-[95%] outline-none ml-1' id='audio1' name='audio' accept="audio/*" hidden required />

								<div className='flex gap-3'>
									<button className="bg-none flex items-center outline-none border-none text-white" onClick={() => setsopen(true)}><IoSearch size={25} /></button>

									{
										!user?.isDJ && (

											<button className="py-2 px-4 text-white text-lg bg-[rgba(255,255,255,0.5)] rounded-md hover:bg-[rgba(255,255,255,0.3)]" onClick={() => { document.getElementById("audio1").click(); setisaddInQue(false) }}>{fileload != 0 && !isaddInQue  ? `${fileload}%` :   "Upload"}</button>
										)
									}

								</div>
							</div>


							<div className="p-2 overflow-y-auto h-[75%] flex flex-col gap-3" onContextMenu={(e) => handleContextMenu(e, { type: "empty" })}>
								{
									allplaylists.length != 0 && allplaylists?.map((data) => (
										<RenderPlayList playlist={data} onSongDragStart={onSongDragStart} onSongDrop={onSongDrop} handleContextMenu={handleContextMenu} />
									))
								}
							</div>

						</div>


						<div className="w-full mt-6">
							<div className="bg-indigo-600 p-3 rounded-t-md flex justify-between reletive items-center">
								<h2 className="text-white text-xl text-center">Listeners Calls</h2>

							</div>
							<div className="rounded-b-md shadow-md p-3 h-[21rem] overflow-x-auto" id='call-contaier'>
								<audio ref={callsElementRef} controls autoPlay hidden>

								</audio>
								{
									Object.keys(callers)?.map((key) => (
										<div className='flex items-center rounded-md py-2 my-4 shadow-sm justify-between'>
											<div className='flex flex-col gap-1'>
												<h1 className='text-xl to-gray-700'>{callers[key]?.name}</h1>
												<p className='text-gray-500'>{callers[key]?.location}</p>
											</div>
											<button className='p-2 text-red-600 rounded-full bg-gray-200' onClick={() => handleCallCut(key)}><MdCall size={23} /></button>
										</div>

									))
								}

								{
									callComing &&
									<div className='flex items-center rounded-md py-2 my-4 shadow-sm justify-between'>
										<h2 className='text-2xl text-gray-800'>{callerName}</h2>
										<div className='flex items-center gap-10'>
											<button className='p-2 text-green-600 rounded-full bg-gray-200' onClick={() => handleCallComing(true)}><MdCall size={23} /></button>
											<button className='p-2 text-red-600 rounded-full bg-gray-200' onClick={() => handleCallComing(false)}><MdCall size={23} /></button>
										</div>
									</div>
								}
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
													<div className={`flex justify-between items-center my-6 rounded-md ${data._id.toString() === nextSong?._id?.toString() ? "bg-yellow-200" : ''}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
														<div className="flex items-center gap-4">
															<span className="text-black text-2xl">{index + 1}</span>
															<Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
															<h2 className="text-xl text-black">{data?.title?.slice(0, 40)}</h2>
														</div>
														<div>
															<button disabled={songStreamloading} title='delete song from playlist' className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 mr-4" onClick={() => handleDeleteFromPlaylist(data)}><MdDelete size={20} /></button>
															<button disabled={songStreamloading} className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handleSelectedSong(data, index)}><FaPlay size={20} /></button>
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
						query && filtersongs && filtersongs.map((data) => (
							<div className="flex justify-between items-center my-6">
								<div className="flex items-center gap-4">
									<Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
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
									<Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
									<h2 className="text-xl text-black">{data?.title}</h2>
								</div>

								<div className="mr-10">
									<button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => { handleSelectFilter(data); fsetsopen(false) }}><FaPlay size={20} /></button>
								</div>
							</div>
						))
					}
				</Dialog>


				{/* song upload  */}
				{/* <Dialog open={songOpen} onClose={() => setSongOpen(false)}>
					<form className='p-3 px-6' onSubmit={(e) => handleSongSubmit(e, isaddInQue)}>

						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="title" className='text-black text-lg'>Title</label>
							<div className='flex items-center relative  py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<MdOutlineSubtitles size={20} className='text-gray-400' />
								<input type='text' value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your title' id='title' name='title' required />
							</div>
						</div>

						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="album" className='text-black text-lg'>Album</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<MdDescription size={20} className='text-gray-400' />
								<input type='text' value={songAlbum} onChange={(e) => setSognAlbum(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter album name' id='album' name='album' required />
							</div>
						</div>

						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="artist" className='text-black text-lg'>Artist Name</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<FaUserAlt size={20} className='text-gray-400' />
								<input type='text' value={songArtist} onChange={(e) => setSognArtist(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your artist' id='artist' name='artist' required />
							</div>
						</div>



						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="audio" className='text-black text-lg'>Audio File</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<MdAudiotrack size={20} className='text-gray-400' />
								<input type='file' onChange={(e) => fileToBase64(e, setAudio, setAudioEx)} className='w-[95%] outline-none ml-1' id='audio' name='audio' accept="audio/*" required />
							</div>
						</div>

						{
							audiofile && <div className="mb-6">
								<audio controls src={audiofile} className="w-full"></audio>
							</div>
						}


						<div className='flex justify-center items-center'>
							<button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{fileload == 0 ? 'Upload' : `${fileload}%`}</button>
						</div>
					</form>
				</Dialog> */}



				<ChatBox open={chatOpen} onClose={() => setChatOpen(false)} message={chatMessage} setMessage={setChatMessage} handleSendMessage={handleSendMessage}>
					{
						messageList.map(data => <Message {...data} />)
					}
				</ChatBox>


				<CreatePlaylistComponets createPlaylistOpen={createPlaylistOpen} setCreatePlaylistOpen={setCreatePlaylistOpen} allsongs={allsongs} getPlaylist={getPlaylist} />
				<EditPlaylistComponets createPlaylistOpen={editPlaylistOpen} setCreatePlaylistOpen={setEditPlaylistOpen} _id={clickedData?._id} allsongs={allsongs} getPlaylist={getPlaylist} allplaylists={allplaylists} />
				<RenamePlaylistComponents createPlaylistOpen={renameOpen} setCreatePlaylistOpen={setRenameOpen} _id={clickedData?._id} title={clickedData?.title} album={clickedData?.album} artist={clickedData?.artist} allsongs={allsongs} getPlaylist={getPlaylist} allplaylists={allplaylists} />


			</section>
			{/* {
				callComing &&
				<div className='w-[10rem] h-[10rem] absolute left-[calc(50%-5rem)] top-14 bg-white shadow-md rounded-md flex flex-col items-center justify-center gap-6'>
					<h2 className='text-2xl text-gray-800'>{callerName}</h2>
					<div className='flex items-center gap-10'>
						<button className='p-2 text-green-600 rounded-full bg-gray-200' onClick={() => handleCallComing(true)}><MdCall size={23} /></button>
						<button className='p-2 text-red-600 rounded-full bg-gray-200' onClick={() => handleCallComing(false)}><MdCall size={23} /></button>
					</div>
				</div>
			} */}

			{contextMenuPosition && (
				<CustomContextMenu xPos={contextMenuPosition.x} yPos={contextMenuPosition.y} setRenameOpen={setRenameOpen} clickedData={clickedData} handleDelete={handleDelete} setCreatePlaylistOpen={setCreatePlaylistOpen} setEditPlaylistOpen={setEditPlaylistOpen} />
			)}
		</>
	);
}