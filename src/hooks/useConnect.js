import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, Track } from 'livekit-client';


const useConnect = (isAdmin = true) => {
    const socketRef = useRef();
    const [isConnected, setIsConnected] = useState(false);
    const roomRef = useRef(new Room());
    const [participantCount, setParticipantCount] = useState(0);

    const connect = async (roomName) => {
        try {
            const response = await fetch(`/api/v1/token?room=${roomName}&isAdmin=${isAdmin}`);
            const data = await response.json();
            roomRef.current.connect(data.serverUrl, data.participantToken);
            setParticipantCount(roomRef.current.numParticipants);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    return {
        isConnected,
        roomRef,
        connect,
        participantCount,
        setParticipantCount,
    }
}

export default useConnect;