import {io} from 'socket.io-client';
import {useRef,useEffect,useState} from 'react';
import {useSelector} from 'react-redux';
import Peer from 'simple-peer';

const socketInit = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempt: 'Infinity',
		timeout: 10000,
		transform: ['websocket']
	}

	return io(process.env.NEXT_PUBLIC_SOCKET_URL, options);
}

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
	const songStreamRef = useRef();
	const gainNodeRef = useRef();
	const localTrackRef = useRef();
	const [micOn, setMicOn] = useState(false);


	const handleOffer = (data) => {
		console.log('offer',data.offer);
		peersRef.current[data.senderId] = new Peer({initiator: false,stream: localStreamRef.current});

		peersRef.current[data.senderId].on('signal', answer => {
			console.log('answer',answer);

            socketRef.current.emit('answer', { answer,recieverId: data.senderId });
        });

        peersRef.current[data.senderId].on('connect', () => {
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
	}

	// useEffect(() => {
	// 	socketRef.current = socketInit();
	// 	socketRef.current.on('offer',handleOffer);

	// 	return () => {
	// 		socketRef.current.off('offer',handleOffer);
	// 	}
	// },[]);

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
	}

	const ownerLeft = async () => {
		console.log('join')
		socketRef.current.disconnect();
		setMicOn(false);
		Object.keys(peersRef.current).forEach((peerId) => {
			peersRef.current[peerId].destroy();
			delete peersRef.current[peerId];
		});
		
	}



	return {socketRef,ownerJoin,ownerLeft,micOn,playSong,pauseSong,changeValume,SwitchOn,handleShare}
}

export default useSocket;