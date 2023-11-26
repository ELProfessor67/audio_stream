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

const useSocket = (streamId,audioRef) => {
	const socketRef = useRef();
	const peerRef = useRef({});
	const [owner,setOwner] = useState('');
	const ownerRef = useRef();
	const [roomActive,setRoomActive] = useState(false);


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
			setRoomActive(true);
			createPeerConnection();
		});

		socketRef.current.on('room-unactive',() => {
			console.log('room room-unactive')
			setRoomActive(false);
			// if(peerRef.current.destroy){
			// 	peerRef.current?.destroy();
			// }
			// peerRef.current = {};
			console.log('peerRef',peerRef.current);
		});

		socketRef.current.on('room-active-now',() => {
			window.location.reload();
		})

		return () => {
			socketRef.current.off('room-active');
			socketRef.current.off('room-unactive');
			socketRef.current.off('room-active-now');
		}

	},[]);

	return {socketRef,userJoin}
}

export default useSocket;