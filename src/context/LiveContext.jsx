'use client';
import { createContext, useContext, useEffect, useState } from "react";
import useConnect from "@/hooks/useConnect";
import { useSelector } from "react-redux";
import { RoomEvent, Track } from "livekit-client";
import { useParams } from "next/navigation";

const LiveContext = createContext();


export const LiveProvider = ({ children, isAdmin = true, isCall = false }) => {
    const { user } = useSelector(store => store.user);
    const { isConnected, connectionError, roomRef, connect, disconnect, participantCount, setParticipantCount } = useConnect(isAdmin);
    const [isLive, setIsLive] = useState(false);
    const [roomActive, setRoomActive] = useState(false);
    const { streamId } = useParams();


    useEffect(() => {
        roomRef.current.on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
            setParticipantCount(roomRef.current.numParticipants);
        });

        roomRef.current.on(RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('Participant disconnected:', participant.identity);
            setParticipantCount(roomRef.current.numParticipants);
        });

        roomRef.current.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', track.kind, participant.identity);
            if (!isCall) {
                console.log('Track subscribed:', track.kind, participant.identity);
                handleTrackSubscribed(track);
            } else {
                console.log('Track subscribed:', track.kind, participant.identity);
                if (participant.identity == "admin" && track.source == Track.Source.Microphone) {

                    setRoomActive(true);
                    setIsLive(true);

                    const audio = document.getElementById('audio');
                    track.attach(audio);
                    // audio.pause();
                }
            }
        });

        roomRef.current.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);
            track.detach();


            if (participant.identity == "admin" && track.source == Track.Source.Microphone) {
                setRoomActive(false);
                setIsLive(false);
            }
        });

    }, [roomRef.current]);


    function handleTrackSubscribed(track) {
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        track.attach(audioElement);
        document.body.appendChild(audioElement);
    }

    // Callers join their call room on mount. The DJ's Go Live page does NOT
    // join on mount any more: every DJ of a station joins the same room as
    // identity 'admin', and LiveKit allows one connection per identity, so a
    // page merely being open kicked whoever was actually live (Oct 21 2026).
    // ownerJoin in useSocket connects right before going live instead.
    useEffect(() => {
        if (streamId) {
            connect(streamId, true);
        }
    }, [streamId]);

    // Room the DJ publishes to; the auth middleware already maps DJs to their station owner.
    const connectForLive = () => connect(user?._id.toString(), false);

    return (
        <LiveContext.Provider value={{ isConnected, connectionError, connectForLive, disconnect, roomRef, participantCount, isLive, setIsLive, roomActive, setRoomActive }}>
            {children}
        </LiveContext.Provider>
    )
}

export const useLive = () => {
    return useContext(LiveContext);
}
