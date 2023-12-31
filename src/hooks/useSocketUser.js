import {io} from 'socket.io-client';
import {useRef,useEffect,useState} from 'react';
import {useSelector} from 'react-redux';
import Peer from 'simple-peer';

const sleep = ms => new Promise(r => window.setTimeout(r,ms))

const socketInit = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempt: 'Infinity',
		timeout: 10000,
		transform: ['websocket']
	}

	return io(process.env.NEXT_PUBLIC_SOCKET_URL, options);
}

const useSocket = (streamId,audioRef,name,isPlay,setIsPlay, message, setMessage) => {
	const socketRef = useRef();
	const peerRef = useRef({});
	const [owner,setOwner] = useState('');
	const ownerRef = useRef();
	const [roomActive,setRoomActive] = useState(false);
	const [scheduleActive,setScheduleActive] = useState(false);
	const [isLive,setIsLive] = useState(false);
	const [autodj,setAutoDj] = useState(false);
	const [messageList,setMessageList] = useState([]);
	const cuurentTimeRef = useRef();
	const playRef = useRef();
	const isLiveRef = useRef();
	const scheduleActiveRef = useRef();

	useEffect(() => {
		playRef.current = isPlay;
	},[isPlay]);

	useEffect(() => {
		isLiveRef.current = isLive;
	},[isLive])
	useEffect(() => {
		scheduleActiveRef.current = scheduleActive;
	},[scheduleActive])



	function handleReceiveMessage(data){
		setMessageList(prev => [...prev,{...data}]);
	}

	


	function handleAutoDjPlay(){
		let startTime = cuurentTimeRef.current;

		if(startTime){
			const ellipTime = ((new Date().getTime()) - startTime)/1000;
			console.log(ellipTime)
			audioRef.current.currentTime = ellipTime;
		}
	}

	async function handleSongChange(data){
		if(scheduleActiveRef.current == true || isLiveRef.current == true){
			return
		}

		setRoomActive(true);
		setAutoDj(true);

		console.log('auto dj',data);

		audioRef.current.src = data?.currentSong?.url;
		
		cuurentTimeRef.current = data?.currentSong?.currentTime;
		
		handleAutoDjPlay();
		console.log('isPlay',playRef.current)
		if(playRef.current){
			console.log('pausing....')
			await audioRef.current.pause();
			await sleep(3000);
			await audioRef.current.play();
			console.log('playing....')
		}

		audioRef.current.removeEventListener('play',handleAutoDjPlay)
		audioRef.current.addEventListener('play',handleAutoDjPlay)
		
	}





	async function handlePlaySchedule (){

		let res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/start-time/${streamId}`);
		res = await res.json();
			
		if(res.starttime){
			// const startTime = +res.headers.get('Start-Time') || null;
			let startTime = res.starttime;
			if(startTime){
				const ellipTime = ((new Date().getTime()) - startTime)/1000;
				audioRef.current.currentTime = ellipTime;
			}
		}else{
			console.log('schedule-unactive');
			setRoomActive(false);
			setScheduleActive(false);
			audioRef.current.src = '';
			audioRef.current.pause();
			audioRef.current.removeEventListener('play',handlePlaySchedule);
		}
		console.log('play');
	}



	async function connectedWithScheduleStream(){
		const url = `${process.env.NEXT_PUBLIC_SOCKET_URL}/schedule/${streamId}`;
		audioRef.current.src = url;

		audioRef.current.addEventListener('play',handlePlaySchedule);
	}

	const userJoin = () => {
		socketRef.current.emit('user-join',{roomId: streamId});
	}

	const createPeerConnection = () => {
		peerRef.current = new Peer({initiator: true});
		peerRef.current.on('signal', data => {
            console.log('offer',data,owner.socketId);
            socketRef.current.emit('offer', { offer: data,recieverId: ownerRef.current.socketId,roomId: streamId });
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
	        console.log(stream)
	        console.log(peerRef.current.connected)
	        audioRef.current.srcObject = stream;
	        setRoomActive(true);
			setIsLive(true);
	        // audioElement.srcObject = stream;
	        // audioElement.play()
	    });

        socketRef.current.on('answer',(data) => {
            console.log('answer',data.answer)
            peerRef.current.signal(data.answer);
        })
	}

	useEffect(() => {
		socketRef.current = socketInit();
		userJoin();
		socketRef.current.on('room-active',(data) => {
			console.log('owner',data?.user)
			setOwner(data?.user);
			ownerRef.current = data?.user;

			createPeerConnection();

			if(data?.user?.welcomeTone){
				const song = new Audio(`${process.env.NEXT_PUBLIC_SOCKET_URL}${data?.user?.welcomeTone}`);
				song.play();
			}
		});

		socketRef.current.on('room-unactive',async (data) => {
			if(data?.butScheduleActive){
				console.log('schedule-active but');
				await connectedWithScheduleStream();
				setRoomActive(true);
				setScheduleActive(true);
			}else{
				console.log('room room-unactive')
				setRoomActive(false);
				setIsLive(false);
				socketRef.current.emit('auto-dj',{roomId: streamId});
			}
			// if(peerRef.current.destroy){
			// 	peerRef.current?.destroy();
			// }
			// peerRef.current = {};
			console.log('peerRef',peerRef.current);
		});

		socketRef.current.on('owner-left',async () => {
			
			if(ownerRef.current.endingTone){
				
				const song = new Audio(`${process.env.NEXT_PUBLIC_SOCKET_URL}${ownerRef.current?.endingTone}`);
				song.play();
				song.addEventListener('loadedmetadata',async function(){
					
					
					await sleep(song.duration * 1000);
					window.alert(2)
					window.location.reload();
				})
			}else{
				window.location.reload();
			}
			
			
		});

		socketRef.current.on('schedule-active',async (data) => {
			console.log('schedule-active')
			await connectedWithScheduleStream();
			setRoomActive(true);
			setScheduleActive(true);
			audioRef.current.removeEventListener('play',handleAutoDjPlay);
		});

		socketRef.current.on('schedule-unactive',() => {
			console.log('schedule-unactive')
			setRoomActive(false);
			setScheduleActive(false);
			audioRef.current.src = '';
			audioRef.current.pause();
			audioRef.current.removeEventListener('play',handlePlaySchedule);
			socketRef.current.emit('auto-dj',{roomId: streamId});
		});

		socketRef.current.on('room-active-now',() => {
			window.location.reload();
		});


		socketRef.current.on('song-change',handleSongChange)
		socketRef.current.on('receive-message',handleReceiveMessage);

		return () => {
			socketRef.current.off('room-active');
			socketRef.current.off('room-unactive');
			socketRef.current.off('room-active-now');
			socketRef.current.off('song-change');
			socketRef.current.off('receive-message');
		}

	},[]);


	const handleRequestSong = (data) => {
		console.log('request',data);
		socketRef.current.emit('send-request-song',{...data,roomId:streamId,name: name || 'unknown'});
	}



	function handleSendMessage (){
		if(message){
			socketRef.current.emit('send-message',{message,roomId:streamId,name: name || 'unknown',isOwner: false});
			setMessage('');
		}
	}

	return {socketRef,userJoin,roomActive,isLive,handleRequestSong, autodj, handleSendMessage, messageList}
}

export default useSocket;