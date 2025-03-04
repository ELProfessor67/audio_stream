import { io } from 'socket.io-client';
import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Peer from 'simple-peer';
import Hls from 'hls.js';


// const peerConfig = {
// 	iceServers: [
// 		{ urls: "stun:stun.l.google.com:19302" },
// 		{ urls: "stun:stun.l.google.com:5349" },
// 		{ urls: "stun:stun1.l.google.com:3478" },
// 		{ urls: "stun:stun1.l.google.com:5349" },
// 		{ urls: "stun:stun2.l.google.com:19302" },
// 		{ urls: "stun:stun2.l.google.com:5349" },
// 		{ urls: "stun:stun3.l.google.com:3478" },
// 		{ urls: "stun:stun3.l.google.com:5349" },
// 		{ urls: "stun:stun4.l.google.com:19302" },
// 		{ urls: "stun:stun4.l.google.com:5349" },
// 		{
// 			urls: "turn:24.199.119.194:3478",
// 			username: "test",
// 			credential: "test123",
// 		}
// 	]
// }

const peerConfig = {
	iceTransportPolicy: "relay",
	iceServers: [
		{
			urls: "stun:stun.relay.metered.ca:80",
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
	]
}

const sleep = ms => new Promise(r => window.setTimeout(r, ms))

const socketInit = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempt: 'Infinity',
		timeout: 10000,
		transform: ['websocket']
	}

	return io(process.env.NEXT_PUBLIC_SOCKET_URL, options);
}


// const createSilentAudioTrack = () => {
// 	const ctx = new AudioContext();
// 	const oscillator = ctx.createOscillator();
// 	const dst = oscillator.connect(ctx.createMediaStreamDestination());
// 	oscillator.start();
// 	return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
// };

// const createFakeStream = () => {
// 	const fakeStream = new MediaStream();
// 	const silentAudioTrack = createSilentAudioTrack();
// 	fakeStream.addTrack(silentAudioTrack);


// 	return fakeStream;
// };


const createSilentAudioTrack = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dest = ctx.createMediaStreamDestination(); // Create MediaStreamDestinationNode

    oscillator.connect(dest); // Connect oscillator to destination
    oscillator.start();

    return Object.assign(dest.stream.getAudioTracks()[0], { enabled: false });
};

const createFakeStream = () => {
    const fakeStream = new MediaStream();
    const silentAudioTrack = createSilentAudioTrack();
    fakeStream.addTrack(silentAudioTrack);
    return fakeStream;
};


const useSocket = (streamId, audioRef, name, isPlay, setIsPlay, message, setMessage, setCallStatus, location, isCall = false) => {
	const socketRef = useRef();
	const peerRef = useRef({});
	const [owner, setOwner] = useState('');
	const ownerRef = useRef();
	const [roomActive, setRoomActive] = useState(false);
	const [scheduleActive, setScheduleActive] = useState(false);
	const [isLive, setIsLive] = useState(false);
	const [autodj, setAutoDj] = useState(false);
	const [messageList, setMessageList] = useState([]);
	const [nextSong, setNextSong] = useState({});
	const [currentSong, setCurrentSong] = useState();
	const cuurentTimeRef = useRef();
	const playRef = useRef();
	const isLiveRef = useRef();
	const scheduleActiveRef = useRef();
	const myStreamRef = useRef();
	const myAudioStreamRef = useRef();
	const hlsSetAlreadyRef = useRef(false);
	const hlsRef = useRef();


	useEffect(() => {
		playRef.current = isPlay;
	}, [isPlay]);

	useEffect(() => {
		isLiveRef.current = isLive;
	}, [isLive])
	useEffect(() => {
		scheduleActiveRef.current = scheduleActive;
	}, [scheduleActive])



	function handleReceiveMessage(data) {
		setMessageList(prev => [...prev, { ...data }]);
	}



	// function handleAutoDjPlay(){
	// 	let startTime = cuurentTimeRef.current;

	// 	if(startTime){
	// 		const ellipTime = ((new Date().getTime()) - startTime)/1000;
	// 		console.log(ellipTime)
	// 		audioRef.current.currentTime = ellipTime;
	// 	}
	// }

	async function handleSongChange(data) {
		if (scheduleActiveRef.current == true || isLiveRef.current == true || isCall == true) {
			return
		}

		console.log("new song", audioRef.current.srcObject)

		setRoomActive(true);
		setAutoDj(true);

		console.log('auto dj', data);

		// audioRef.current.src = data?.currentSong?.url;
		if (audioRef.current.srcObject) {
			audioRef.current.srcObject = null;

			audioRef.current.src = `${process.env.NEXT_PUBLIC_ICE_CAST_SERVER}/${streamId}`;
			audioRef.current.load();
			audioRef.current.play();

		};

		if (audioRef.current.src != `${process.env.NEXT_PUBLIC_ICE_CAST_SERVER}/${streamId}`) {
			audioRef.current.src = `${process.env.NEXT_PUBLIC_ICE_CAST_SERVER}/${streamId}`;
			audioRef.current.load();

			if (playRef.current == true) {
				audioRef.current.play();
			}
		}


		cuurentTimeRef.current = data?.currentSong?.currentTime;
		setNextSong(data?.currentSong.nextSong);
		console.log('isPlay', playRef.current);

		// if(playRef.current){
		// 	console.log('pausing....')
		// 	await audioRef.current.pause();
		// 	await sleep(3000);
		// 	await audioRef.current.play();
		// 	console.log('playing....')
		// }

		// audioRef.current.removeEventListener('play',handleAutoDjPlay)
		// audioRef.current.addEventListener('play',handleAutoDjPlay)

	}





	async function handlePlaySchedule() {

		let res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/start-time/${streamId}`);
		res = await res.json();

		if (res.starttime) {
			// const startTime = +res.headers.get('Start-Time') || null;
			let startTime = res.starttime;
			if (startTime) {
				const ellipTime = ((new Date().getTime()) - startTime) / 1000;
				audioRef.current.currentTime = ellipTime;
			}
		} else {
			console.log('schedule-unactive');
			setRoomActive(false);
			setScheduleActive(false);
			audioRef.current.src = '';
			audioRef.current.pause();
			audioRef.current.removeEventListener('play', handlePlaySchedule);
		}
		console.log('play');
	}



	async function connectedWithScheduleStream() {
		const url = `${process.env.NEXT_PUBLIC_SOCKET_URL}/schedule/${streamId}`;
		audioRef.current.src = url;

		audioRef.current.addEventListener('play', handlePlaySchedule);
	}

	const userJoin = () => {
		socketRef.current.emit('user-join', { roomId: streamId });
	}

	const createPeerConnection = () => {

		if (isCall) {
			myStreamRef.current = createFakeStream();
			peerRef.current = new Peer({ initiator: true, stream: myStreamRef.current, config: peerConfig })
		} else {
			peerRef.current = new Peer({ initiator: true, config: peerConfig })
		}



		peerRef.current.on('signal', data => {
			console.log('offer', data, owner.socketId);
			socketRef.current.emit('offer', { offer: data, recieverId: ownerRef.current.socketId, roomId: streamId, isCall });
		});

		peerRef.current.on('connect', () => {
			console.log('Connection established');
		});

		peerRef.current.on('data', data => {
			console.log('Received data:', data);
		});

		peerRef.current.on('close', () => {
			console.log('Connection closed');
		});

		peerRef.current.on('error', err => {
			console.error('Peer error:', err);
		});

		peerRef.current.on('stream', (stream) => {
			console.log(stream, "stream")
			console.log(peerRef.current.connected)
			audioRef.current.srcObject = stream;

			if (playRef.current == true) {
				audioRef.current.pause();
				audioRef.current.play();
			}

			setRoomActive(true);
			setIsLive(true);
			// audioElement.srcObject = stream;
			// audioElement.play()
		});

		socketRef.current.on('answer', (data) => {
			console.log('answer', data.answer)
			peerRef.current.signal(data.answer);
		})
	}

	useEffect(() => {
		socketRef.current = socketInit();
		userJoin();
		socketRef.current.on('room-active', (data) => {
			console.log('owner', data?.user)
			setOwner(data?.user);
			if (data.nextSong) {
				setNextSong(data.nextSong)
			}
			if (data.currentSong) {
				setCurrentSong(data.currentSong)
			}
			ownerRef.current = data?.user;

			createPeerConnection();

			// if (data?.user?.welcomeTone && !data.tonePlayed) {
			// 	console.log('tones played')
			// 	const song = new Audio(`${process.env.NEXT_PUBLIC_SOCKET_URL}${data?.user?.welcomeTone}`);
			// 	song.addEventListener("canplaythrough", () => {
			// 		console.log("Audio loaded successfully");
			// 		// audioRef.current.pause();
			// 		if (isCall == false) {
			// 			song.play().then(() => {
			// 				console.log("Audio started playing");
			// 			}).catch((error) => {
			// 				console.error("Error playing audio:", error);
			// 			});
			// 		}

			// 	});
			// 	song.addEventListener("ended", () => {
			// 		// audioRef.current.play();
			// 		console.log("Audio has finished playing");
			// 	});
			// 	song.load();
			// }
		});


		socketRef.current.on('play-welcome-tone', (data) => {
			if (data?.welcomeTone) {
				console.log('welcome tone started')
				const song = new Audio(`${process.env.NEXT_PUBLIC_SOCKET_URL}${data?.welcomeTone}`);

				song.addEventListener("canplaythrough", () => {
					console.log("Audio loaded successfully");
					if (isCall == false) {
						if (!isLiveRef.current) {
							audioRef.current.pause();
						}
						song.play().then(() => {
							console.log("Audio started playing");
						}).catch((error) => {
							console.error("Error playing audio:", error);
						});
					}
				});
				song.addEventListener("ended", () => {
					audioRef.current.play();
					console.log("Audio has finished playing");
				});
			}
		});

		socketRef.current.on('room-unactive', async (data) => {
			if (data?.butScheduleActive) {
				console.log('schedule-active but');
				await connectedWithScheduleStream();
				setRoomActive(true);
				setScheduleActive(true);
			} else {
				console.log('room room-unactive')
				setRoomActive(false);
				setIsLive(false);
				socketRef.current.emit('auto-dj', { roomId: streamId });
			}
			// if(peerRef.current.destroy){
			// 	peerRef.current?.destroy();
			// }
			// peerRef.current = {};
			console.log('peerRef', peerRef.current);
		});

		socketRef.current.on('owner-left', async () => {

			if (ownerRef.current.endingTone) {
				const song = new Audio(`${process.env.NEXT_PUBLIC_SOCKET_URL}${ownerRef.current?.endingTone}`);
				song.addEventListener("canplaythrough", () => {
					console.log("Audio loaded successfully");
					if (isCall == false) {
						audioRef.current.pause();
						song.play().then(() => {
							console.log("Audio started playing");
						}).catch((error) => {
							console.error("Error playing audio:", error);
						});
					}
				});
				song.addEventListener("ended", async () => {
					window.location.reload();
					// sleep(1000);
					// console.log("Audio has finished playing");
					// setRoomActive(false);
					// setIsLive(false);
					// audioRef.current.play();
					// socketRef.current.emit('auto-dj', { roomId: streamId });
				});
				song.load();
			} else {
				window.location.reload();
				// setRoomActive(false);
				// setIsLive(false);
				// audioRef.current.play();
				// socketRef.current.emit('auto-dj', { roomId: streamId });
			}


		});

		socketRef.current.on('schedule-active', async (data) => {
			console.log('schedule-active')
			await connectedWithScheduleStream();
			setRoomActive(true);
			setScheduleActive(true);

		});

		socketRef.current.on('schedule-unactive', () => {
			console.log('schedule-unactive')
			setRoomActive(false);
			setScheduleActive(false);
			audioRef.current.src = '';
			audioRef.current.pause();
			audioRef.current.removeEventListener('play', handlePlaySchedule);
			socketRef.current.emit('auto-dj', { roomId: streamId });
		});

		socketRef.current.on('room-active-now', ({ user, nextSong, currentSong }) => {
			// window.location.reload();

			console.log("room active now")
			setOwner(user);
			if (nextSong) {
				setNextSong(nextSong)
			}
			if (currentSong) {
				setCurrentSong(currentSong)
			}
			ownerRef.current = user;
			createPeerConnection();
		});


		socketRef.current.on('song-change', handleSongChange)
		socketRef.current.on('receive-message', handleReceiveMessage);


		socketRef.current.on('call-response', (data) => {
			if (data.response) {
				setCallStatus('accepted');
				audioRef.current.play();
				peerRef.current.replaceTrack(myStreamRef.current?.getTracks().find((track) => track.kind === 'audio'), myAudioStreamRef.current.getTracks().find((track) => track.kind === 'audio'), myStreamRef.current);
			} else {
				setCallStatus('rejected');
			}
		});


		socketRef.current.on('admin-call-cut', (data) => {
			myStreamRef.current?.getTracks().forEach(track => track.stop());
			myAudioStreamRef.current?.getTracks().forEach(track => track.stop());
			// peerRef.current.removeStream(myStreamRef.current);
			setCallStatus('complete');
		});


		socketRef.current.on('next-song', (({ nextSong }) => {
			setNextSong(nextSong);
		}))

		return () => {
			socketRef.current.off('room-active');
			socketRef.current.off('room-unactive');
			socketRef.current.off('room-active-now');
			socketRef.current.off('song-change');
			socketRef.current.off('receive-message');
			socketRef.current.off('next-song');
		}

	}, []);


	const handleRequestSong = (data) => {
		console.log('request', data);
		socketRef.current.emit('send-request-song', { ...data, roomId: streamId, name: name || 'unknown' });
	}



	function handleSendMessage() {
		if (message) {
			socketRef.current.emit('send-message', { message, roomId: streamId, name: name || 'unknown', isOwner: false });
			setMessage('');
		}
	}



	async function callAdmin() {

		myAudioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
		socketRef.current.emit('call-admin', { roomId: streamId, name: `${name}|${location}` || 'unknown' });
	}

	async function cutCall() {
		myStreamRef.current?.getTracks().forEach(track => track.stop());
		myAudioStreamRef.current?.getTracks().forEach(track => track.stop());
		// peerRef.current.removeStream(myStreamRef.current);
		socketRef.current.emit('cut-admin', { roomId: streamId });
		setCallStatus('complete');
	}




	return { socketRef, userJoin, roomActive, isLive, handleRequestSong, autodj, handleSendMessage, messageList, callAdmin, cutCall, nextSong }
}

export default useSocket;