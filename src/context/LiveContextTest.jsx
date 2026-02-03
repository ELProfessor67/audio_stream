'use client';
import { createContext, useContext, useEffect, useState } from "react";
import useConnect from "@/hooks/useConnect";
import { useSelector } from "react-redux";
import { RoomEvent, Track } from "livekit-client";
import { useParams } from "next/navigation";

const LiveContext = createContext();


export const LiveProvider = ({ children, isAdmin = true, isCall = false }) => {
    const { user } = useSelector(store => store.user);
    const { isConnected, roomRef, connect, participantCount, setParticipantCount } = useConnect(isAdmin);
    const [isLive, setIsLive] = useState(false);
    const [roomActive, setRoomActive] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const {streamId} = useParams();


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
            handleTrackSubscribed(track);
           
        });

        roomRef.current.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);
            track.detach();
            

            if(participant.identity == "admin" && track.source == Track.Source.Microphone){
                setRoomActive(false);
                setIsLive(false);
            }
        });

    }, [roomRef.current]);


    function handleTrackSubscribed(track) {
        const audioElement = document.createElement('audio');
        // audioElement.autoplay = true;
        track.attach(audioElement);
        document.body.appendChild(audioElement);
        if(isPlaying){
            audioElement.play();
        }
    }

    useEffect(() => {
        if (isAdmin && user?.originalId) {
            connect(user?.originalId?.toString());
        }

        if(!isAdmin){
            connect(streamId);
        }
    }, [user,streamId]);

    return (
        <LiveContext.Provider value={{ isConnected, roomRef, participantCount, isLive, setIsLive, roomActive, setRoomActive, isPlaying, setIsPlaying }}>
            {children}
        </LiveContext.Provider>
    )
}

export const useLive = () => {
    return useContext(LiveContext);
}
