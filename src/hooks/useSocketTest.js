import { io } from 'socket.io-client';
import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Peer from 'simple-peer';
import axios from 'axios';
import { data } from 'autoprefixer';
import hark from 'hark';



const peerConfig = {
	iceTransportPolicy: "relay",
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun.l.google.com:5349" },
		{ urls: "stun:stun1.l.google.com:3478" },
		{ urls: "stun:stun1.l.google.com:5349" },
		{ urls: "stun:stun2.l.google.com:19302" },
		{ urls: "stun:stun2.l.google.com:5349" },
		{ urls: "stun:stun3.l.google.com:3478" },
		{ urls: "stun:stun3.l.google.com:5349" },
		{ urls: "stun:stun4.l.google.com:19302" },
		{ urls: "stun:stun4.l.google.com:5349" },
		{
			urls: "turn:24.199.119.194:3478",
			username: "test",
			credential: "test123",
		},
		{
			urls: "turn:global.relay.metered.ca:80",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turn:global.relay.metered.ca:80?transport=tcp",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turn:global.relay.metered.ca:443",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turns:global.relay.metered.ca:443?transport=tcp",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turns:relay1.expressturn.com:3478",
			username: "efZL51SQ640A85CEFE",
			credential: "QWATvGdKMEWFRCgg",
		},

	]
}




// const peerConfig = {
// 	iceServers: [
// 		{
// 			urls: "stun:stun.relay.metered.ca:80",
// 		},
// 		{
// 			urls: "turn:global.relay.metered.ca:80",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 		{
// 			urls: "turn:global.relay.metered.ca:80?transport=tcp",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 		{
// 			urls: "turn:global.relay.metered.ca:443",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 		{
// 			urls: "turns:global.relay.metered.ca:443?transport=tcp",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 	]
// }



const socketInit = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempt: 'Infinity',
		timeout: 10000,
		transform: ['websocket']
	}

	return io(process.env.NEXT_PUBLIC_SOCKET_URL, options);
}

const sleep = ms => new Promise(r => window.setTimeout(r, ms))




const useSocket = (setSongPlaying, songPlaying, selectPlayListSong, selectedSong, setSeletedSong, volume, micVolume, filterPlaying, chatMessage, setChatMessage, setUnread, chatOpen, nextSong, setHistory, handleSelectedSong) => {
	const socketRef = useRef();
	const { user } = useSelector(store => store.user);
	const peersRef = useRef({});
	const localStreamRef = useRef();
	const songSourceRef = useRef();
	const constantref = useRef();
	const songStreamRef = useRef(null);
	const gainNodeRef = useRef();
	const localTrackRef = useRef();
	const [micOn, setMicOn] = useState(false);
	const [requests, setRequests] = useState([]);
	const [listners, setListners] = useState([]);
	const [newUser, setNewUser] = useState([]);
	const [sduration, setsduration] = useState(0);
	const [remaining, setRemaining] = useState(0);
	const [progress, setProgress] = useState(0);
	const [fprogress, setFProgress] = useState(0);
	const [fremaining, setFRemaining] = useState(0);
	const [fduration, setfduration] = useState(0);
	const [songStreamloading, setSongStreamLoading] = useState(false);
	const [filterStreamloading, setFilterStreamLoading] = useState(false);
	const [voiceComing, setVoiceComing] = useState(false);
	const recordMediaRef = useRef();
	const [continuePlay, setContinuePlay] = useState(true);
	const [repeatPlaylist, setRepeatPlaylist] = useState(false);
	const [messageList, setMessageList] = useState([]);
	const [filterBase, setFilterBase] = useState(0);
	const [songBase, setSongBase] = useState(0);
	const [callerId, setCallerId] = useState('');
	const [callComing, setcallComing] = useState(false);
	const [callerName, setCallerName] = useState('');
	const [callers, setCallers] = useState([]);
	const [callDataChange, setCallDataChange] = useState(false);
	// console.log('voiceComing',voiceComing);

	const micGainNodeRef = useRef();
	const micOnRef = useRef(false);
	const songPlayRef = useRef(false);
	const audioContextRef = useRef(false);
	const changeCurrentTimeRef = useRef(null);
	const selectPlayListSongRef = useRef({});
	const selectedSongRef = useRef({});
	const volumeRef = useRef(0.3);
	const continuePlayRef = useRef();
	const repeatPlaylistRef = useRef();
	const chatOpenRef = useRef();


	const filterSourceRef = useRef();
	const filterStreamRef = useRef();
	const filterGainNodeRef = useRef();
	const filtterAudioContextRef = useRef();
	const filterchangeCurrentTimeRef = useRef();
	const gainNodeStreamRef = useRef();
	const filterGainStreamNodeRef = useRef();
	const filterPlayingRef = useRef();
	const analyserRef = useRef();
	const scriptProcessorRef = useRef();
	const mediaRecorderRef = useRef();
	const combinedStreamRef = useRef();
	const speechEventsRef = useRef();
	const micStreamRef = useRef();
	const [recordReady, setRecordingReady] = useState(false);


	const songAnalyserRef = useRef();
	const filterAnalyserRef = useRef();
	const callerStreamsRef = useRef({});
	const callerDetailsRef = useRef({});
	const callsElementRef = useRef(null);
	const nextSongRef = useRef({});




	useEffect(() => {
		selectPlayListSongRef.current = selectPlayListSong;
	}, [selectPlayListSong]);

	useEffect(() => {
		continuePlayRef.current = continuePlay;
	}, [continuePlay])

	useEffect(() => {
		repeatPlaylistRef.current = repeatPlaylist;
	}, [repeatPlaylist])

	useEffect(() => {
		recordMediaRef.current = new MediaStream();
		mediaRecorderRef.current = new MediaRecorder(recordMediaRef.current);
		setRecordingReady(true);
	}, [])

	useEffect(() => {
		chatOpenRef.current = chatOpen;
	}, [chatOpen])

	useEffect(() => {
		volumeRef.current = volume;
	}, [volume])

	useEffect(() => {
		selectedSongRef.current = selectedSong;
	}, [selectedSong]);

	useEffect(() => {
		songPlayRef.current = songPlaying;
	}, [songPlaying])

	useEffect(() => {
		filterPlayingRef.current = filterPlaying;
	}, [filterPlaying]);


	useEffect(() => {
		if (nextSong) {
			nextSongRef.current = nextSong;
		} else {
			nextSongRef.current = { title: 'End Song' };
		}
	}, [nextSong])





	function AudioProcessSongFilter(isFilter) {
		let analyser;

		if (isFilter) {
			analyser = filterAnalyserRef.current
		} else {
			analyser = songAnalyserRef.current
		}

		if (isFilter && !filterPlayingRef.current) {
			setFilterBase(0)
			return
		}

		if (!isFilter && !songPlayRef.current) {
			setSongBase(0);
			return
		}

		const array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);
		const arraySum = array.reduce((a, value) => a + value, 0);
		const average = arraySum / array.length;
		// console.info('voulme',Math.round(average));
		// colorPids(average);
		const voiceVolume = Math.round(average);
		if (isFilter) {
			setFilterBase(voiceVolume);
		} else {
			setSongBase(voiceVolume);
		}
	}


	function getSongStream(songUrl, gainNodeRef, songSourceRef, volume, audioContextRef, progress, progressCallback, setduration, isFilter = false) {
		return fetch(songUrl)
			.then(response => response.arrayBuffer())
			.then(arrayBuffer => {
				return new Promise((resolve, reject) => {
					const audioContext = new (window.AudioContext || window.webkitAudioContext)();
					audioContext.decodeAudioData(arrayBuffer, buffer => {

						const gainNode = audioContext.createGain();
						gainNode.connect(audioContext.destination);
						gainNode.gain.value = volume;

						gainNodeRef.current = gainNode



						const createSource = () => {
							const source = audioContext.createBufferSource();
							source.buffer = buffer;
							source.connect(gainNode);
							songSourceRef.current = source;
							return source;
						}

						let source = createSource();





						audioContextRef.current = audioContext;
						let startTime = audioContext.currentTime;
						setduration(Math.floor(source.buffer.duration));
						console.info('startTime', startTime)
						const updateProgess = () => {
							const currentTime = audioContext.currentTime;
							const duration = source.buffer.duration;
							const progress = {
								currentTime,
								duration,
								percentage: (currentTime / duration) * 100,
								remainTime: duration - currentTime,
							}
							progressCallback(progress);


							if (isFilter) {
								if (currentTime < duration && filterPlayingRef.current) {
									requestAnimationFrame(updateProgess);
								} else {
									if (filterPlayingRef.current && isFilter) {
										console.log('next filter');
										// pending auto play filter 
									}
								}
							} else {


								if (currentTime < duration && songPlayRef.current) {
									requestAnimationFrame(updateProgess);
								} else {
									if (songPlayRef.current && !isFilter && continuePlayRef.current === true) {
										const sindex = selectPlayListSongRef.current?.songs?.indexOf(selectedSongRef.current);
										if (sindex >= selectPlayListSongRef.current?.songs?.length - 1) {
											if (repeatPlaylistRef.current) {
												// const song = selectPlayListSongRef.current?.songs[0];
												// setSeletedSong(song);
												// setSongPlaying(true);
												// setProgress(0);
												// playSong(song.audio,volumeRef.current);
												setSongPlaying(false);
												setProgress(0);
											} else {
												setSongPlaying(false);
												setProgress(0)
											}

										} else {
											const song = selectPlayListSongRef.current?.songs[sindex + 1];

											handleSelectedSong(song, sindex);
											// setSeletedSong(song);
											// setSongPlaying(true);
											// setProgress(0);
											// playSong(song.audio,volumeRef.current);
										}
									}
								}
							}

						}

						const changeCurrentTime = async (newTime) => {
							if (newTime >= 0 && newTime <= source.buffer.duration) {
								source.stop();
								source = createSource();
								source.start(0, newTime, audioContext.buffer.duration);
								audioContext.resume();
								performance.now();
							}
						}


						source.start();
						updateProgess();



						const songStream = audioContext.createMediaStreamDestination();


						source.connect(songStream);


						const analyseraudioContext = new (window.AudioContext || window.webkitAudioContext)();
						const audio = analyseraudioContext.createMediaStreamSource(songStream.stream);
						//deteting the audio
						const analyser = analyseraudioContext.createAnalyser();
						const scriptProcessor = analyseraudioContext.createScriptProcessor(2048, 1, 1);
						analyser.smoothingTimeConstant = 0.8;
						analyser.fftSize = 1024;
						if (isFilter) {
							filterAnalyserRef.current = analyser;
						} else {
							songAnalyserRef.current = analyser;
						}


						audio.connect(analyser);
						analyser.connect(scriptProcessor);
						scriptProcessor.connect(analyseraudioContext.destination);

						scriptProcessor.addEventListener('audioprocess', () => AudioProcessSongFilter(isFilter));


						resolve({ songStream: songStream.stream, changeCurrentTime });
					}, reject);
				});
			})
			.then(songStream => {
				console.log(songStream);
				return songStream;
			})
			.catch(error => console.error('Error loading song:', error));
	}



	useEffect(() => {
		micOnRef.current = micOn;
	}, [micOn])


	function handleReceiveMessage(data) {
		setMessageList(prev => [...prev, { ...data }]);
		if (chatOpenRef.current === false) {
			setUnread(prev => prev + 1);
		}
	}

	async function handleNewUser(peerId) {
		setNewUser(prev => [...prev, peerId]);
		await sleep(2000);



		const audioContext = new (window.AudioContext || window.webkitAudioContext)();



		const mic = audioContext.createMediaStreamSource(localStreamRef.current);
		const dest = audioContext.createMediaStreamDestination();
		mic.connect(dest);



		if (songStreamRef.current) {
			const song = audioContext.createMediaStreamSource(songStreamRef.current);
			song.connect(dest);
		}

		if (filterStreamRef.current) {
			const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
			filter.connect(dest);
		}

		for (let peerId in callerStreamsRef.current) {
			const userStream = audioContext.createMediaStreamSource(callerStreamsRef.current[peerId]);
			userStream.connect(dest);
		}

		const combinedStream = dest.stream;

		peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'), combinedStream.getTracks()[0], localStreamRef.current);
		// }
	}



	async function addStreamInMain(id) {
		try {
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();

			const mic = audioContext.createMediaStreamSource(localStreamRef.current);


			const dest = audioContext.createMediaStreamDestination();
			mic.connect(dest);

			if (filterStreamRef.current) {
				const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
				filter.connect(dest);
			}

			if (songStreamRef.current) {
				const song = audioContext.createMediaStreamSource(songStreamRef.current);
				song.connect(dest);
			}

			for (let peerId in callerStreamsRef.current) {
				const userStream = audioContext.createMediaStreamSource(callerStreamsRef.current[peerId]);
				userStream.connect(dest);
			}

			const combinedStream = dest.stream;
			// peersRef.current[id].addStream(combinedStream);


			// recording 
			recordMediaRef.current.removeTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'))
			combinedStreamRef.current = combinedStream;
			recordMediaRef.current.addTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'));


			Object.keys(peersRef.current).forEach((peerId) => {
				//replace track
				if (peersRef.current[peerId].isCall == false) {

					const audioSender = peersRef.current[peerId].getSenders().find(sender => sender.track && sender.track.kind === "audio");
					if (audioSender && combinedStream.getTracks().length > 0) {
						const newAudioTrack = combinedStream.getTracks()[0];

						// Replace the existing track with the new audi track
						audioSender.replaceTrack(newAudioTrack);
						console.log("✅ Audio track replaced successfully!");
					} else {
						console.warn("⚠️ No audio sender found or new stream has no audio track.");
					}
				}

				// peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'), combinedStream.getTracks()[0], localStreamRef.current);
			});
		} catch (error) {

		}

	}


	// const handleOffer = (data) => {
	// 	console.log("offer recieved",data)
	// 	const isCall = data.isCall;
	// 	peersRef.current[data.senderId] = new Peer({ initiator: false, stream: isCall == true ? micStreamRef.current : localStreamRef.current,config: peerConfig });

	// 	peersRef.current[data.senderId].on('signal', answer => {
	// 		console.log('answer', answer);

	// 		socketRef.current.emit('answer', { answer, recieverId: data.senderId });
	// 	});

	// 	peersRef.current[data.senderId].on('connect', () => {
	// 		console.log(data.senderId, songStreamRef.current, micOn);
	// 		console.log('new user come', data.senderId);
	// 		handleNewUser(data.senderId);


	// 		console.log('Connection established');
	// 	});

	// 	peersRef.current[data.senderId].on('data', data => {
	// 		console.log('Received data:', data);
	// 	});

	// 	peersRef.current[data.senderId].on('close', () => {
	// 		console.log('Connection closed');
	// 	});

	// 	peersRef.current[data.senderId].on('error', err => {
	// 		console.error('Peer error:', err);
	// 	});


	// 	// test
	// 	peersRef.current[data.senderId].on('stream', (stream) => {
	// 		console.info('stream coming');
	// 		console.log(stream);
	// 		console.log(peersRef.current[data.senderId].connected);

	// 		callerStreamsRef.current[data.senderId] = stream;
	// 		// callsElementRef.current.srcObject = stream;
	// 		const audio = new Audio();
	// 		audio.srcObject = stream;
	// 		audio.controls = true;
	// 		audio.play()
	// 		// document.getElementById("call-contaier").appendChild(audio);

	// 		// callsElementRef.current.srcObject = stream;
	// 		addStreamInMain(data.senderId);
	// 	});

	// 	peersRef.current[data.senderId].signal(data?.offer);

	// }


	const handleOffer = async (data) => {
		if (!peersRef.current[data.senderId]) {
			peersRef.current[data.senderId] = new RTCPeerConnection(peerConfig);

			//on ice candidate
			peersRef.current[data.senderId].onicecandidate = (event) => {
				if (event.candidate) {
					const answer = {
						type: "candidate",
						content: event.candidate
					}
					socketRef.current.emit('answer', { answer, recieverId: data.senderId });
				}
			};

			//ontrack
			peersRef.current[data.senderId].ontrack = (event) => {
				const stream = event.streams[0];
				console.info('stream coming', stream);

				callerStreamsRef.current[data.senderId] = stream;
				const audio = new Audio();
				audio.srcObject = stream;
				audio.controls = true;
				audio.play();
				addStreamInMain(data.senderId);
			}


			//on connection state changed
			peersRef.current[data.senderId].onconnectionstatechange = () => {
				console.log("Connection State Changed:", peersRef.current[data.senderId]?.connectionState);
			}

			peersRef.current[data.senderId].onnegotiationneeded = async () => {
				console.log("🛑 Negotiation needed!");

				try {
					const offer = await peersRef.current[data.senderId].createOffer();
					await peersRef.current[data.senderId].setLocalDescription(offer);
					const answer = {
						type: "offer",
						content: offer
					}
					socketRef.current.emit('answer', { answer, recieverId: data.senderId });
					console.log("✅ Sent new offer due to negotiation.");
				} catch (error) {
					console.error("Error during renegotiation:", error);
				}
			};

			//when is call true
			const isCall = data.isCall;
			if (isCall) {
				peersRef.current[data.senderId].isCall = true;
				micStreamRef.current.getTracks().forEach(track => {
					peersRef.current[data.senderId].addTrack(track, micStreamRef.current);
				});
			} else {
				peersRef.current[data.senderId].isCall = false;
				combinedStreamRef.current.getTracks().forEach(track => {
					peersRef.current[data.senderId].addTrack(track, combinedStreamRef.current);
				});
			}
		}


		const signal = data.offer;

		if (signal.type == "answer") {
			peersRef.current[data.senderId].setRemoteDescription(new RTCSessionDescription(signal.content))
		}

		if (signal.type == "candidate") {
			peersRef.current[data.senderId].addIceCandidate(new RTCIceCandidate(signal.content));
		}

		if (signal.type == "offer") {
			peersRef.current[data.senderId].setRemoteDescription(new RTCSessionDescription(signal.content))

			const answerContent = await peersRef.current[data.senderId].createAnswer();
			await peersRef.current[data.senderId].setLocalDescription(answerContent);

			const answer = {
				type: "answer",
				content: answerContent
			}
			socketRef.current.emit('answer', { answer, recieverId: data.senderId });
		}



	}




	function progressCallback(progress) {
		setRemaining(Math.floor(progress.remainTime));
		setProgress(Math.floor(progress.currentTime));
		// console.info('progress',progress);
	}

	function handleProgressChange(e) {
		console.log(e.target.value)
		setProgress(e.target.value);

	}

	async function playSong(url, volume) {
		console.log(url);

		if (songStreamloading) {
			console.log('stream loading true')
			return
		}

		if (songSourceRef.current?.stop) {
			songSourceRef.current.stop();
		}

		setSongStreamLoading(true);






		try {
			let { songStream, changeCurrentTime } = await getSongStream(url, gainNodeRef, songSourceRef, volume, audioContextRef, progress, progressCallback, setsduration);
			changeCurrentTimeRef.current = changeCurrentTime;


			const gaudioContext = new (window.AudioContext || window.webkitAudioContext)();
			const gsong = gaudioContext.createMediaStreamSource(songStream);
			const gdest = gaudioContext.createMediaStreamDestination();
			const gsongGainNode = gaudioContext.createGain();
			// micGainNode.connect(audioContext.destination);

			gsong.connect(gsongGainNode);
			gsongGainNode.connect(gdest);
			gsongGainNode.gain.value = volume;
			gainNodeStreamRef.current = gsongGainNode;




			songStreamRef.current = gdest.stream;
			songStream = gdest.stream;

			setSongStreamLoading(false);

			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
			console.error('mic', typeof (localStreamRef.current), localStreamRef.current)
			const mic = audioContext.createMediaStreamSource(localStreamRef.current);
			console.error('ye mic ho gaya ha')
			console.error('song', typeof (songStream), songStream);
			const song = audioContext.createMediaStreamSource(songStream);
			console.error('ye song bhi ho gaya')
			const dest = audioContext.createMediaStreamDestination();
			mic.connect(dest);
			song.connect(dest);
			if (filterStreamRef.current) {
				const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
				filter.connect(dest);
			}

			for (let peerId in callerStreamsRef.current) {
				const userStream = audioContext.createMediaStreamSource(callerStreamsRef.current[peerId]);
				userStream.connect(dest);
			}

			const combinedStream = dest.stream;


			// recording 

			recordMediaRef.current.removeTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'))
			// combinedStreamRef.current = combinedStream.getTracks()[0];
			combinedStreamRef.current = combinedStream;
			recordMediaRef.current.addTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'));

			// end 

			Object.keys(peersRef.current).forEach((peerId) => {

				if (peersRef.current[peerId].isCall == false) {
					const audioSender = peersRef.current[peerId].getSenders().find(sender => sender.track && sender.track.kind === "audio");
					if (audioSender && combinedStream.getTracks().length > 0) {
						const newAudioTrack = combinedStream.getTracks()[0];

						// Replace the existing track with the new audi track
						audioSender.replaceTrack(newAudioTrack);
						console.log("✅ Audio track replaced successfully!");
					} else {
						console.warn("⚠️ No audio sender found or new stream has no audio track.");
					}
				}
				// peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'), combinedStream.getTracks()[0], localStreamRef.current);
			});

			nextSongRef.current.user = user;
			console.info('sss', nextSongRef.current, selectedSongRef.current)

			socketRef.current?.emit("next-song", { roomId: user?._id.toString(), nextSong: nextSongRef.current, currentSong: selectedSongRef.current });

		} catch (err) {
			setSongStreamLoading(false);
			console.error('error : ', err.message)
		}
	}

	const pauseSong = () => {
		if (songSourceRef.current?.stop) {
			songSourceRef.current.stop();
		}
	}

	const changeValume = (value) => {
		if (gainNodeRef.current?.gain && gainNodeStreamRef.current?.gain) {
			console.log('inside song volume')
			gainNodeRef.current.gain.value = value;
			gainNodeStreamRef.current.gain.value = value;
		}
	}


	// filter functions


	function filterprogressCallback(progress) {
		// console.log('filter progress',progress)
		setFRemaining(Math.floor(progress.remainTime));
		setFProgress(Math.floor(progress.currentTime));
		// console.info('progress',progress);
	}

	async function playFilter(url, volume) {
		console.log(url);

		if (filterStreamloading) {
			console.log('filter loading is track');
			return
		}

		if (filterSourceRef.current?.stop) {
			filterSourceRef.current.stop();
		}

		setFilterStreamLoading(true);

		try {
			let { songStream, changeCurrentTime } = await getSongStream(url, filterGainNodeRef, filterSourceRef, volume, filtterAudioContextRef, fprogress, filterprogressCallback, setfduration, true);
			filterchangeCurrentTimeRef.current = changeCurrentTime;


			const gaudioContext = new (window.AudioContext || window.webkitAudioContext)();
			const gsong = gaudioContext.createMediaStreamSource(songStream);
			const gdest = gaudioContext.createMediaStreamDestination();
			const gsongGainNode = gaudioContext.createGain();
			// micGainNode.connect(audioContext.destination);

			gsong.connect(gsongGainNode);
			gsongGainNode.connect(gdest);
			gsongGainNode.gain.value = volume;
			filterGainStreamNodeRef.current = gsongGainNode;




			filterStreamRef.current = gdest.stream;
			songStream = gdest.stream;

			setFilterStreamLoading(false);


			// filterStreamRef.current = songStream;
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();

			const mic = audioContext.createMediaStreamSource(localStreamRef.current);

			const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
			const dest = audioContext.createMediaStreamDestination();
			mic.connect(dest);
			filter.connect(dest);
			if (songStreamRef.current) {
				const song = audioContext.createMediaStreamSource(songStreamRef.current);
				song.connect(dest);
			}

			for (let peerId in callerStreamsRef.current) {
				const userStream = audioContext.createMediaStreamSource(callerStreamsRef.current[peerId]);
				userStream.connect(dest);
			}
			const combinedStream = dest.stream;




			// recording 

			recordMediaRef.current.removeTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'))
			// combinedStreamRef.current = combinedStream.getTracks()[0];
			combinedStreamRef.current = combinedStream;
			recordMediaRef.current.addTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'));

			// end





			Object.keys(peersRef.current).forEach((peerId) => {

				if (peersRef.current[peerId].isCall == false) {
					const audioSender = peersRef.current[peerId].getSenders().find(sender => sender.track && sender.track.kind === "audio");
					if (audioSender && combinedStream.getTracks().length > 0) {
						const newAudioTrack = combinedStream.getTracks()[0];

						// Replace the existing track with the new audi track
						audioSender.replaceTrack(newAudioTrack);
						console.log("✅ Audio track replaced successfully!");
					} else {
						console.warn("⚠️ No audio sender found or new stream has no audio track.");
					}
				}
				// peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'), combinedStream.getTracks()[0], localStreamRef.current);
			});

		} catch (err) {
			setFilterStreamLoading(false);
			console.error('error : ', err.message)
		}
	}


	const pauseFilter = () => {
		if (filterSourceRef.current?.stop) {
			filterSourceRef.current.stop();
		}
	}

	const changeFilterValume = (value) => {
		if (filterGainNodeRef.current?.gain && filterGainStreamNodeRef.current?.gain) {
			filterGainNodeRef.current.gain.value = value;
			filterGainStreamNodeRef.current.gain.value = value;
		}
	}

	const changeMicValume = (value) => {
		console.log(value);
		if (micGainNodeRef.current?.gain) {
			console.log('inside', value);
			micGainNodeRef.current.gain.value = value;
		}
	}


	const SwitchOn = async () => {


		if (micOn) {
			localStreamRef.current.getTracks().forEach(track => track.enabled = false);
			setMicOn(false);
		} else {
			setMicOn(true);
			localStreamRef.current.getTracks().forEach(track => track.enabled = true);
		}
	}

	useEffect(() => {
		socketRef.current?.on('recieve-request-song', (data) => {
			console.log('requests', data);
			setRequests(prev => [...prev, data]);
		});

		socketRef.current?.on('user-disconnet', ({ id }) => {
			console.log('disconnect', id)
			if (peersRef.current[id]) {
				delete peersRef.current[id];
			}

			if (callerDetailsRef.current[id]) {
				delete callerDetailsRef.current[id];
				delete callerStreamsRef.current[id];
				addStreamInMain(id);
				setCallDataChange(prev => !prev);
				setcallComing(false);
			}
			setNewUser(prev => prev.filter(peerId => peerId != id));
		})

		socketRef.current?.on('receive-message', handleReceiveMessage);

		socketRef.current?.on('call-coming', (data) => {
			setCallerId(data.callerID);
			setcallComing(true);
			setCallerName(data.name);
			// peersRef.current[data.callerID].on('stream',(stream) => {
			// 	window.alert(5);
			// })
		})

		socketRef.current?.on('cut-admin', (data) => {
			delete callerDetailsRef.current[data.callerID];
			delete callerStreamsRef.current[data.callerID];
			addStreamInMain(data.callerID);
			setCallDataChange(prev => !prev);
			setcallComing(false);
		})

		return () => {
			socketRef.current?.off('recieve-request-song');
			socketRef.current?.off('user-disconnet');
			socketRef.current?.off('receive-message');
		}
	}, [socketRef.current]);


	useEffect(() => {
		function confirmReload(event) {
			var confirmationMessage = "Are you sure you want to stop streaming?";

			// For modern browsers
			event.returnValue = confirmationMessage;
			return confirmationMessage;
		}

		window.addEventListener('beforeunload', confirmReload);

		return () => {
			window.removeEventListener('beforeunload', confirmReload);
		}
	}, [])

	const handleShare = async (id=null) => {
		const url = `${window.location.origin}/public/${id ? id : user?._id}`;
		await navigator.clipboard.writeText(url);
	}


	// function AudioProcess() {
	// 	if (!micOnRef.current) {
	// 		setVoiceComing(false);
	// 		return
	// 	}
	// 	const array = new Uint8Array(analyserRef.current.frequencyBinCount);
	// 	analyserRef.current.getByteFrequencyData(array);
	// 	const arraySum = array.reduce((a, value) => a + value, 0);
	// 	const average = arraySum / array.length;
	// 	// console.info('voulme',Math.round(average));
	// 	// colorPids(average);
	// 	const voiceVolume = Math.round(average);
	// 	if (voiceVolume > 20) {
	// 		setVoiceComing(true);
	// 	} else {
	// 		setVoiceComing(false);
	// 	}
	// };


	// let volumeHistory = [];
	// const historyLength = 5;
	// let debounceTimeout = null;

	// function AudioProcess() {
	// 	if (!micOnRef.current) {
	// 		setVoiceComing(false);
	// 		return;
	// 	}

	// 	try {
	// 		const array = new Uint8Array(analyserRef.current.frequencyBinCount);
	// 		analyserRef.current.getByteFrequencyData(array);

	// 		const arraySum = array.reduce((a, value) => a + value, 0);
	// 		const average = arraySum / array.length;
	// 		const voiceVolume = Math.round(average);

	// 		// Smoothing
	// 		// volumeHistory.push(voiceVolume);
	// 		// if (volumeHistory.length > historyLength) {
	// 		// 	volumeHistory.shift();
	// 		// }
	// 		// const smoothedVolume = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length;

	// 		// Debouncing
	// 		if (debounceTimeout === null) {
	// 			debounceTimeout = setTimeout(() => {
	// 				if (voiceVolume > 20) {
	// 					setVoiceComing(true);
	// 				} else {
	// 					setVoiceComing(false);
	// 				}
	// 				debounceTimeout = null;
	// 			}, 100);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error processing audio data:', error);
	// 	}
	// }






	const ownerJoin = async (id = null) => {
		console.log('join')
		socketRef.current = socketInit();
		socketRef.current.on('offer', handleOffer);
		let userTemp = JSON.parse(JSON.stringify(user));
		if(id){
			userTemp._id = id;
		}

		socketRef.current.emit('owner-join', { user: userTemp });
		// localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		


		//when user speack
		speechEventsRef.current = hark(stream, { threshold: -50 });

		speechEventsRef.current.on('speaking', () => {
			console.log("🎤 User is speaking...");
			setVoiceComing(true);
		});

		speechEventsRef.current.on('stopped_speaking', () => {
			console.log("🤫 User stopped speaking...");
			setVoiceComing(false);
		});


		micStreamRef.current = stream;
		setMicOn(true);

		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const mic = audioContext.createMediaStreamSource(stream);
		const dest = audioContext.createMediaStreamDestination();
		const micGainNode = audioContext.createGain();



		mic.connect(micGainNode);
		micGainNode.connect(dest);
		micGainNode.gain.value = micVolume;
		micGainNodeRef.current = micGainNode;
		localStreamRef.current = dest.stream;



		// recording 
		// combinedStreamRef.current = localStreamRef.current.getTracks().find((track) => track.kind === 'audio')
		combinedStreamRef.current = localStreamRef.current
		recordMediaRef.current.addTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'));

		// end





		//deteting the audio
		// const analyser = audioContext.createAnalyser();
		// const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
		// analyser.smoothingTimeConstant = 0.8;
		// analyser.fftSize = 1024;
		// analyserRef.current = analyser;
		// scriptProcessorRef.current = scriptProcessor;

		// mic.connect(analyser);
		// analyser.connect(scriptProcessor);
		// scriptProcessor.connect(audioContext.destination);
		// scriptProcessorRef.current.addEventListener('audioprocess', AudioProcess);
	}

	const ownerLeft = async () => {

		console.log('left')

		socketRef.current.disconnect();
		setMicOn(false);
		localStreamRef.current.getTracks().forEach(track => track.enabled = false);



		const listeners = Object.keys(peersRef.current).length;

		Object.keys(peersRef.current).forEach((peerId) => {
			peersRef.current[peerId].destroy();
			delete peersRef.current[peerId];
		});

		try {
			const { data } = await axios.post('/api/v1/listeners', { listeners });
			console.log(data);
		} catch (err) {
			console.log(err.message);
		}

	}

	function handleSendMessage() {
		if (message) {
			socketRef.current?.emit('send-message', { message: chatMessage, roomId: user?._id.toString(), name: user?.name || 'owner', isOwner: true });
			setChatMessage('');
		}
	}

	function handleCallComing(response) {
		socketRef.current?.emit('call-response', { response, callerId });
		setcallComing(false);
		if (response) {
			callerDetailsRef.current[callerId] = {
				name: callerName.split('|')[0],
				location: callerName.split('|')[1],
				callerId
			}
		}
		setCallerId('');
		setCallerName('');
	}

	async function handleCallCut(id) {
		socketRef.current?.emit('admin-call-cut', { callerId: id });
		delete callerDetailsRef.current[id];
		delete callerStreamsRef.current[id];

		addStreamInMain(id);
		setCallDataChange(prev => !prev);
	}




	return { socketRef, ownerJoin, ownerLeft, micOn, playSong, pauseSong, changeValume, SwitchOn, handleShare, requests, peersRef: newUser, sduration, remaining, progress, handleProgressChange, setProgress, playFilter, pauseFilter, changeFilterValume, fprogress, fremaining, fduration, changeMicValume, voiceComing, filterStreamloading, songStreamloading, recordMediaRef: mediaRecorderRef, recordReady, continuePlay, setContinuePlay, repeatPlaylist, setRepeatPlaylist, handleSendMessage, messageList, songBase, filterBase, callComing, callerName, handleCallComing, callsElementRef, callerDetailsRef, handleCallCut, callDataChange }
}

export default useSocket;