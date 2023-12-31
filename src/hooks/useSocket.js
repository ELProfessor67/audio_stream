import {io} from 'socket.io-client';
import {useRef,useEffect,useState} from 'react';
import {useSelector} from 'react-redux';
import Peer from 'simple-peer';
import axios from 'axios';

const socketInit = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempt: 'Infinity',
		timeout: 10000,
		transform: ['websocket']
	}

	return io(process.env.NEXT_PUBLIC_SOCKET_URL, options);
}

const sleep = ms => new Promise(r => window.setTimeout(r,ms))




const useSocket = (setSongPlaying,songPlaying,selectPlayListSong,selectedSong,setSeletedSong,volume,micVolume,filterPlaying, chatMessage,setChatMessage, setUnread, chatOpen) => {
	const socketRef = useRef();
	const {user} = useSelector(store => store.user);
	const peersRef = useRef({});
	const localStreamRef = useRef();
	const songSourceRef = useRef();
	const constantref = useRef();
	const songStreamRef = useRef(null);
	const gainNodeRef = useRef();
	const localTrackRef = useRef();
	const [micOn, setMicOn] = useState(false);
	const [requests,setRequests] = useState([]);
	const [listners,setListners] = useState([]);
	const [newUser,setNewUser] = useState([]);
	const [sduration,setsduration] = useState(0);
	const [remaining,setRemaining] = useState(0);
	const [progress,setProgress] = useState(0);
	const [fprogress,setFProgress] = useState(0);
	const [fremaining,setFRemaining] = useState(0);
	const [fduration,setfduration] = useState(0);
	const [songStreamloading,setSongStreamLoading] = useState(false);
	const [filterStreamloading,setFilterStreamLoading] = useState(false);
	const [voiceComing,setVoiceComing] = useState(false);
	const recordMediaRef = useRef();
	const [continuePlay,setContinuePlay] = useState(true);
	const [repeatPlaylist,setRepeatPlaylist]	= useState(false);
	const [messageList,setMessageList] = useState([]);
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
	const [recordReady,setRecordingReady] = useState(false);

	useEffect(() => {
		selectPlayListSongRef.current = selectPlayListSong;
	},[selectPlayListSong]);

	useEffect(() => {
		continuePlayRef.current = continuePlay;
	},[continuePlay])

	useEffect(() => {
		repeatPlaylistRef.current = repeatPlaylist;
	},[repeatPlaylist])

	useEffect(() => {
		recordMediaRef.current = new MediaStream();
		mediaRecorderRef.current = new MediaRecorder(recordMediaRef.current);
		setRecordingReady(true);
	},[])

	useEffect(() => {
		chatOpenRef.current = chatOpen;
	},[chatOpen])

	useEffect(() => {
		volumeRef.current = volume;
	},[volume])

	useEffect(() => {
		selectedSongRef.current = selectedSong;
	},[selectedSong]);

	useEffect(() => {
		songPlayRef.current = songPlaying;
	},[songPlaying])

	useEffect(() => {
		filterPlayingRef.current = filterPlaying;
	},[filterPlaying]);


	function getSongStream(songUrl,gainNodeRef,songSourceRef,volume,audioContextRef,progress,progressCallback,setduration,isFilter=false) {
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
	            console.info('startTime',startTime)
	            const updateProgess = () => {
	            	const currentTime = audioContext.currentTime;
	            	const duration = source.buffer.duration;
	            	const progress = {
	            		currentTime,
	            		duration,
	            		percentage: (currentTime/duration) * 100,
	            		remainTime: duration - currentTime,
	            	}
	            	progressCallback(progress);
	            	

	            	if(isFilter){
	            		if(currentTime < duration && filterPlayingRef.current){
		            		requestAnimationFrame(updateProgess);
		            	}else{
		            		if(filterPlayingRef.current && isFilter){
		            			console.log('next filter');
		            			// pending auto play filter 
		            		}
		            	}
	            	}else{
		            	if(currentTime < duration && songPlayRef.current){
		            		requestAnimationFrame(updateProgess);
		            	}else{
		            		if(songPlayRef.current && !isFilter && continuePlayRef.current === true){
		            			const sindex = selectPlayListSongRef.current?.songs?.indexOf(selectedSongRef.current);
								if(sindex >= selectPlayListSongRef.current?.songs?.length-1){
									if(repeatPlaylistRef.current){
										const song = selectPlayListSongRef.current?.songs[0];
										setSeletedSong(song);
										setSongPlaying(true);
										setProgress(0);
										playSong(song.audio,volumeRef.current);
									}else{
										setSongPlaying(false);
										setProgress(0)
									}

								}else{
									const song = selectPlayListSongRef.current?.songs[sindex+1];
									setSeletedSong(song);
									setSongPlaying(true);
									setProgress(0);
									playSong(song.audio,volumeRef.current);
								}	
		            		}
		            	}
	            	}

	            }

	            const changeCurrentTime = async (newTime) => {
	            	if(newTime >= 0 && newTime <= source.buffer.duration){
	            		source.stop();
	            		source = createSource();
						source.start(0,newTime,audioContext.buffer.duration);
	            		audioContext.resume();
	            		performance.now();
	            	}
	            }


	            source.start();
	            updateProgess();
	            
	            

	            const songStream = audioContext.createMediaStreamDestination();
	            

	            source.connect(songStream);

	            resolve({songStream: songStream.stream,changeCurrentTime});
	            }, reject);
	          });
	        })
	        .then(songStream => {
	          console.log(songStream);
	          return songStream;
	        })
	        .catch(error => console.error('Error loading song:', error));
	}



	useEffect(() =>{
		micOnRef.current = micOn;
	},[micOn])


	function handleReceiveMessage(data){
		setMessageList(prev => [...prev,{...data}]);
		if(chatOpenRef.current === false){
			setUnread(prev => prev+1);
		}
	}

	async function handleNewUser(peerId){
		setNewUser(prev => [...prev,peerId]);
		await sleep(2000);
		

        
        	const audioContext = new (window.AudioContext || window.webkitAudioContext)();



		    const mic = audioContext.createMediaStreamSource(localStreamRef.current);
		    const dest = audioContext.createMediaStreamDestination();
			mic.connect(dest);

			

		    if(songStreamRef.current){
		    	const song = audioContext.createMediaStreamSource(songStreamRef.current);
		    	song.connect(dest);
		    }
			
			if(filterStreamRef.current){
				const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
				filter.connect(dest);
			}
			
			const combinedStream = dest.stream;

		    peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),combinedStream.getTracks()[0],localStreamRef.current);
        // }
	}


	const handleOffer = (data) => {
		console.log('offer',data.offer);
		peersRef.current[data.senderId] = new Peer({initiator: false,stream: localStreamRef.current});

		peersRef.current[data.senderId].on('signal', answer => {
			console.log('answer',answer);

            socketRef.current.emit('answer', { answer,recieverId: data.senderId });
        });

        peersRef.current[data.senderId].on('connect', () => {
        	console.log(data.senderId,songStreamRef.current,micOn);
        	console.log('new user come',data.senderId);
        	handleNewUser(data.senderId);
        	
        	
            console.log('Connection established');
        });

        peersRef.current[data.senderId].on('data', data => {
            console.log('Received data:', data);
        });

        peersRef.current[data.senderId].on('close', () => {
            console.log('Connection closed');
        });

        peersRef.current[data.senderId].on('error', err => {
            console.error('Peer error:', err);
        });

        peersRef.current[data.senderId].signal(data?.offer);

	}

	function progressCallback(progress){
		setRemaining(Math.floor(progress.remainTime));
		setProgress(Math.floor(progress.currentTime));
		// console.info('progress',progress);
	}

	function handleProgressChange(e){
		console.log(e.target.value)
		setProgress(e.target.value);
		
	}

	async function playSong(url,volume){
		console.log(url);

		if(songStreamloading){
			console.log('stream loading true')
			return
		}

		if(songSourceRef.current?.stop){
			songSourceRef.current.stop();
		}

		setSongStreamLoading(true);

		

		


		try{
			let {songStream,changeCurrentTime} = await getSongStream(url,gainNodeRef,songSourceRef,volume,audioContextRef,progress,progressCallback,setsduration);
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
		    console.error('mic',typeof(localStreamRef.current),localStreamRef.current)
		    const mic = audioContext.createMediaStreamSource(localStreamRef.current);
		    console.error('ye mic ho gaya ha')
		    console.error('song',typeof(songStream),songStream);
			const song = audioContext.createMediaStreamSource(songStream);
			console.error('ye song bhi ho gaya')
			const dest = audioContext.createMediaStreamDestination();
			mic.connect(dest);
			song.connect(dest);
			if(filterStreamRef.current){
				const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
				filter.connect(dest);
			}
			const combinedStream = dest.stream;


			// recording 
			
			recordMediaRef.current.removeTrack(combinedStreamRef.current)
			combinedStreamRef.current = combinedStream.getTracks()[0];
			recordMediaRef.current.addTrack(combinedStreamRef.current);

		    // end 
			
		    Object.keys(peersRef.current).forEach((peerId) => {
		        peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),combinedStream.getTracks()[0],localStreamRef.current);
		    });
			
		}catch(err){
			setSongStreamLoading(false);
			console.error('error : ',err.message)
		}
	}

	const pauseSong = () => {
		if(songSourceRef.current?.stop){
			songSourceRef.current.stop();
		}
	}

	const changeValume = (value) => {
		if(gainNodeRef.current?.gain && gainNodeStreamRef.current?.gain){
			console.log('inside song volume')
			gainNodeRef.current.gain.value = value;
			gainNodeStreamRef.current.gain.value = value;
		}
	}


	// filter functions


	function filterprogressCallback(progress){
		// console.log('filter progress',progress)
		setFRemaining(Math.floor(progress.remainTime));
		setFProgress(Math.floor(progress.currentTime));
		// console.info('progress',progress);
	}

	async function playFilter(url,volume){
		console.log(url);

		if(filterStreamloading){
			console.log('filter loading is track');
			return
		}

		if(filterSourceRef.current?.stop){
			filterSourceRef.current.stop();
		}

		setFilterStreamLoading(true);

		try{
			let {songStream,changeCurrentTime} = await getSongStream(url,filterGainNodeRef,filterSourceRef,volume,filtterAudioContextRef,fprogress,filterprogressCallback,setfduration,true);
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
			if(songStreamRef.current){
				const song = audioContext.createMediaStreamSource(songStreamRef.current);
				song.connect(dest);
			}
			const combinedStream = dest.stream;




			// recording 

			recordMediaRef.current.removeTrack(combinedStreamRef.current)
			combinedStreamRef.current = combinedStream.getTracks()[0];
			recordMediaRef.current.addTrack(combinedStreamRef.current);

		    // end





		    Object.keys(peersRef.current).forEach((peerId) => {
		        peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),combinedStream.getTracks()[0],localStreamRef.current);
		    });
			
		}catch(err){
			setFilterStreamLoading(false);
			console.error('error : ',err.message)
		}
	}


	const pauseFilter = () => {
		if(filterSourceRef.current?.stop){
			filterSourceRef.current.stop();
		}
	}

	const changeFilterValume = (value) => {
		if(filterGainNodeRef.current?.gain && filterGainStreamNodeRef.current?.gain){
			filterGainNodeRef.current.gain.value = value;
			filterGainStreamNodeRef.current.gain.value = value;
		}
	}

	const changeMicValume = (value) => {
		console.log(value);
		if(micGainNodeRef.current?.gain){
			console.log('inside',value);
			micGainNodeRef.current.gain.value = value;
		}
	}


	const SwitchOn = async () => {
		

		if(micOn){
			localStreamRef.current.getTracks().forEach(track => track.enabled = false);
			setMicOn(false);
		}else{
			setMicOn(true);
			localStreamRef.current.getTracks().forEach(track => track.enabled = true);
		}
	}

	useEffect(() => {
		socketRef.current?.on('recieve-request-song',(data) => {
			console.log('requests',data);
			setRequests(prev => [...prev,data]);
		});

		socketRef.current?.on('user-disconnet',({id}) => {
			console.log('disconnect',id)
			if(peersRef.current[id]){
				delete peersRef.current[id];
			}
			setNewUser(prev => prev.filter(peerId => peerId != id));
		})

		socketRef.current?.on('receive-message',handleReceiveMessage);

		return () => {
			socketRef.current?.off('recieve-request-song');
			socketRef.current?.off('user-disconnet');
			socketRef.current?.off('receive-message');
		}
	},[socketRef.current]);


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
	},[])

	const handleShare = async () => {
		const url = `${window.location.origin}/public/${user?._id}`;
		await navigator.clipboard.writeText(url);
	}


	function AudioProcess() {
		if(!micOnRef.current){
			setVoiceComing(false);
			return
		}
	    const array = new Uint8Array(analyserRef.current.frequencyBinCount);
	    analyserRef.current.getByteFrequencyData(array);
	    const arraySum = array.reduce((a, value) => a + value, 0);
	    const average = arraySum / array.length;
	    // console.info('voulme',Math.round(average));
	      // colorPids(average);
	    const voiceVolume = Math.round(average);
	    if(voiceVolume > 20){
	    	setVoiceComing(true);
	    }else{
	    	setVoiceComing(false);
	    }
	};



	const ownerJoin = async () => {
		console.log('join')
		socketRef.current = socketInit();
		socketRef.current.on('offer',handleOffer);
		socketRef.current.emit('owner-join',{user});
		// localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
  		combinedStreamRef.current = localStreamRef.current.getTracks().find((track) => track.kind === 'audio')
		recordMediaRef.current.addTrack(combinedStreamRef.current);

		// end
		




  		//deteting the audio
  		const analyser = audioContext.createAnalyser();
  		const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
  		analyser.smoothingTimeConstant = 0.8;
    	analyser.fftSize = 1024;
    	analyserRef.current = analyser;
    	scriptProcessorRef.current = scriptProcessor;

    	mic.connect(analyser);
    	analyser.connect(scriptProcessor);
    	scriptProcessor.connect(audioContext.destination);
    	scriptProcessorRef.current.addEventListener('audioprocess',AudioProcess);
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

		try{
			const {data} = await axios.post('/api/v1/listeners',{listeners});
			console.log(data);
		}catch(err){
			console.log(err.message);
		}
		
	}

	function handleSendMessage (){
		if(message){
			socketRef.current?.emit('send-message',{message: chatMessage,roomId:user?._id.toString(),name: user?.name || 'owner',isOwner: true});
			setChatMessage('');
		}
	}


	return {socketRef,ownerJoin,ownerLeft,micOn,playSong,pauseSong,changeValume,SwitchOn,handleShare,requests,peersRef:newUser,sduration,remaining,progress,handleProgressChange,setProgress,playFilter,pauseFilter,changeFilterValume,fprogress,fremaining,fduration,changeMicValume,voiceComing,filterStreamloading,songStreamloading,recordMediaRef:mediaRecorderRef,recordReady, continuePlay,setContinuePlay, repeatPlaylist,setRepeatPlaylist,handleSendMessage,messageList}
}

export default useSocket;