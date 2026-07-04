import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, Track, RoomOptions } from 'livekit-client';


const useConnect = (isAdmin = true) => {
    const socketRef = useRef();
    const [isConnected, setIsConnected] = useState(false);
    const roomRef = useRef(new Room({
        adaptiveStream: true,
        dynacast: true,
        reconnectPolicy: {
            maxRetries: 10,
            nextRetryDelayInMs: (context) => {
                // Exponential backoff: 300ms, 600ms, 1200ms... up to 10s
                return Math.min(300 * Math.pow(2, context.retryCount), 10000);
            }
        }
    }));
    const [participantCount, setParticipantCount] = useState(0);

    const connect = async (roomName, isCall = false) => {
        try {
            const response = await fetch(`/api/v1/token?room=${roomName}&isAdmin=${isAdmin}&isCall=${isCall}`);
            const data = await response.json();
            await roomRef.current.connect(data.serverUrl, data.participantToken);
            setIsConnected(true);
            setParticipantCount(roomRef.current.numParticipants);
            console.log('✅ LiveKit room connected successfully');
        } catch (error) {
            console.error('Error connecting to LiveKit room:', error);
            setIsConnected(false);
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