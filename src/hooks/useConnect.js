import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, ConnectionState, DisconnectReason } from 'livekit-client';

// Reasons LiveKit will not auto-recover from; the DJ has to act.
const LEAVE_MESSAGES = {
    DUPLICATE_IDENTITY: 'Another Go Live session took over this station. Close other Go Live tabs/devices and press Go Live again.',
    PARTICIPANT_REMOVED: 'You were removed from the audio server.',
    ROOM_DELETED: 'The audio room was closed.',
};

const useConnect = (isAdmin = true) => {
    const socketRef = useRef();
    const [isConnected, setIsConnected] = useState(false);
    // Human-readable reason for the last drop; '' while connected.
    const [connectionError, setConnectionError] = useState('');
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

    // Keep isConnected truthful. Before this, it was set once on connect and
    // never cleared, so a DJ kicked by a duplicate 'admin' (or a dropped
    // network) still saw a running show while nothing was published.
    useEffect(() => {
        const room = roomRef.current;
        const onDisconnected = (reason) => {
            // reason is a DisconnectReason enum number; the enum maps it back to its name.
            const name = DisconnectReason[reason] || String(reason);
            console.warn('LiveKit disconnected:', name);
            setIsConnected(false);
            // Our own disconnect() (end of show) is not an error.
            setConnectionError(name === 'CLIENT_INITIATED' ? '' : (LEAVE_MESSAGES[name] || `Audio server connection lost (${name}).`));
        };
        const onReconnecting = () => {
            console.warn('LiveKit reconnecting...');
            setIsConnected(false);
            setConnectionError('Audio server connection lost, reconnecting...');
        };
        const onConnected = () => {
            setIsConnected(true);
            setConnectionError('');
        };
        room.on(RoomEvent.Disconnected, onDisconnected);
        room.on(RoomEvent.Reconnecting, onReconnecting);
        room.on(RoomEvent.Reconnected, onConnected);
        room.on(RoomEvent.Connected, onConnected);
        return () => {
            room.off(RoomEvent.Disconnected, onDisconnected);
            room.off(RoomEvent.Reconnecting, onReconnecting);
            room.off(RoomEvent.Reconnected, onConnected);
            room.off(RoomEvent.Connected, onConnected);
        };
    }, []);

    // Returns true when the room is usable for publishing. Safe to call when
    // already connected; a stale/half-dead room is torn down and rejoined.
    const connect = async (roomName, isCall = false) => {
        try {
            const room = roomRef.current;
            if (room.state === ConnectionState.Connected) {
                setIsConnected(true);
                setConnectionError('');
                setParticipantCount(room.numParticipants);
                return true;
            }
            if (room.state !== ConnectionState.Disconnected) {
                await room.disconnect();
            }
            const response = await fetch(`/api/v1/token?room=${roomName}&isAdmin=${isAdmin}&isCall=${isCall}`);
            const data = await response.json();
            await room.connect(data.serverUrl, data.participantToken);
            setIsConnected(true);
            setConnectionError('');
            setParticipantCount(room.numParticipants);
            console.log('✅ LiveKit room connected successfully');
            return true;
        } catch (error) {
            console.error('Error connecting to LiveKit room:', error);
            setIsConnected(false);
            setConnectionError('Could not reach the audio server. Check your internet and try again.');
            return false;
        }
    }

    const disconnect = async () => {
        try {
            if (roomRef.current.state !== ConnectionState.Disconnected) {
                await roomRef.current.disconnect();
            }
        } catch (error) {
            console.error('Error disconnecting from LiveKit room:', error);
        }
        setIsConnected(false);
        setConnectionError('');
    }

    return {
        isConnected,
        connectionError,
        roomRef,
        connect,
        disconnect,
        participantCount,
        setParticipantCount,
    }
}

export default useConnect;
