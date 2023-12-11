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

function getSongStream(songUrl,gainNodeRef,songSourceRef,volume) {
    return fetch(songUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(arrayBuffer, buffer => {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
              
            const gainNode = audioContext.createGain();

                // Connect the source to the gain node
            source.connect(gainNode);

                // Connect the gain node to the audio context destination
            gainNode.connect(audioContext.destination);

                // Set the gain value to 0 (mute)
            gainNode.gain.value = volume;
            gainNodeRef.current = gainNode

                // Start the playback
            songSourceRef.current = source;
            source.start();

            const songStream = audioContext.createMediaStreamDestination();
            source.connect(songStream);

            resolve(songStream.stream);
            }, reject);
          });
        })
        .then(songStream => {
          console.log(songStream);
          return songStream;
        })
        .catch(error => console.error('Error loading song:', error));
}

const useSocket = (setSongPlaying) => {
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
	const [newUser,setNewUser] = useState([])
	const micOnRef = useRef(false);

	useEffect(() =>{
		micOnRef.current = micOn;
	},[micOn])

	async function handleNewUser(peerId){
		setNewUser(prev => [...prev,peerId]);
		await sleep(2000);
		if(!micOnRef.current){
			console.log('mic is off')
			localStreamRef.current?.getTracks().forEach((track) => track.stop());
        }

        if(songStreamRef.current){
        	console.log(peersRef.current[peerId])
        	console.log('someting is here song stream')
        	if(peersRef.current[peerId]){
        		console.log('someting is here song stream')
				peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),songStreamRef.current,localStreamRef.current);
			}
        }

        if(micOnRef.current){
        	console.log('micOn')
        	if(songStreamRef.current){
				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				localTrackRef.current = audioStream.getTracks()[0];		
				if(peersRef.current[peerId]){
					peersRef.current[peerId].replaceTrack(songStreamRef.current,localTrackRef.current,localStreamRef.current);
				}
				
			}else{
				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				localTrackRef.current = audioStream.getTracks()[0];
				
				if(peersRef.current[peerId]){
					peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),localTrackRef.current,localStreamRef.current);
				}
				
			}
        }
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

	const playSong = async (url,volume) => {
		console.log(url);
		if(songSourceRef.current?.stop){
			songSourceRef.current.stop();
		}

		setMicOn(false);

		const songStream = await getSongStream(url,gainNodeRef,songSourceRef,volume);
		console.log(songStream);
		songStreamRef.current = songStream.getTracks()[0];
		Object.keys(peersRef.current).forEach(peerId => {
			console.log(peersRef.current[peerId].connected)
			if(peersRef.current[peerId]){
				peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),songStreamRef.current,localStreamRef.current);
			}
		});

		



		
		// const setStream = () => new Promise(async (resolve) => {
		// 		Object.keys(peersRef.current).forEach(peerId => {
					
		// 			console.log('connected',peersRef.current[peerId].connected);
		// 			if(peersRef.current[peerId]){
		// 				if(songStreamRef.current){
		// 					console.log('replace track')
		// 					peersRef.current[peerId].replaceTrack(songStreamRef.current,songStream.getTracks()[0],localStreamRef.current);
		// 				}else{
		// 					console.log('add track')
		// 					peersRef.current[peerId].addTrack(songStream.getTracks()[0],localStreamRef.current);
		// 				}
						
		// 			}
		// 		});

		// 		resolve();
		// 	});

		// await setStream();
		// songStreamRef.current = songStream.getTracks()[0];
	}

	const pauseSong = () => {
		if(songSourceRef.current?.stop){
			songSourceRef.current.stop();
		}
	}

	const changeValume = (value) => {
		if(gainNodeRef.current?.gain){
			gainNodeRef.current.gain.value = value;
		}
	}

	const SwitchOn = async () => {
		setSongPlaying(false);
		if(songSourceRef.current?.stop){
			songSourceRef.current.stop();
		}

		if(micOn){
			setMicOn(false);
			if(localTrackRef.current?.stop){
				localTrackRef.current.stop();	
			}else{
				localStreamRef.current?.getTracks().forEach((track) => track.stop());
			}
		}else{
			setMicOn(true);
			if(songStreamRef.current){
				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				localTrackRef.current = audioStream.getTracks()[0];
				Object.keys(peersRef.current).forEach(peerId => {
					console.log(peersRef.current[peerId].connected)
					if(peersRef.current[peerId]){
						peersRef.current[peerId].replaceTrack(songStreamRef.current,localTrackRef.current,localStreamRef.current);
					}
				});
			}else{
				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				localTrackRef.current = audioStream.getTracks()[0];
				Object.keys(peersRef.current).forEach(peerId => {
					console.log(peersRef.current[peerId].connected)
					if(peersRef.current[peerId]){
						peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'),localTrackRef.current,localStreamRef.current);
					}
				});
			}
		}

		// if(micOn){
		// 	localStreamRef.current.getTracks().forEach(track => track.enabled = false);
		// 	setMicOn(false);
		// }else{
		// 	setMicOn(true);
		// 	localStreamRef.current.getTracks().forEach(track => track.enabled = true);
		// }
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

		return () => {
			socketRef.current?.off('recieve-request-song');
			socketRef.current?.off('user-disconnet');
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
		const url = `${window.location.origin}/public/${user._id}`;
		await navigator.clipboard.writeText(url);
	}



	const ownerJoin = async () => {
		console.log('join')
		socketRef.current = socketInit();
		socketRef.current.on('offer',handleOffer);
		socketRef.current.emit('owner-join',{user});
		localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
		setMicOn(true);

		// const stream = await getSongStream('/audio/welcome.mp3',constantref,constantref,1);
		
		
		// Object.keys(peersRef.current).forEach(peerId => {
		// 	console.log(peersRef.current[peerId].connected)
		// 	if(peersRef.current[peerId]){
		// 		peersRef.current[peerId].addTrack(stream.getTracks()[0],localStreamRef.current);
		// 	}
		// });
	}

	const ownerLeft = async () => {
		// await new Promise(async (resolve) => {
		// 	const stream = await getSongStream('/audio/good bye.mp3',constantref,constantref,1);
		
		// 	Object.keys(peersRef.current).forEach(peerId => {
		// 		console.log(peersRef.current[peerId].connected)
		// 		if(peersRef.current[peerId]){
		// 			peersRef.current[peerId].addTrack(stream.getTracks()[0],localStreamRef.current);
		// 		}
		// 	});

		// 	resolve();
		// })

		// await sleep(7000);
		
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


	return {socketRef,ownerJoin,ownerLeft,micOn,playSong,pauseSong,changeValume,SwitchOn,handleShare,requests,peersRef:newUser}
}

export default useSocket;