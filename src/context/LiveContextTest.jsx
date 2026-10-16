'use client';
import { createContext, useContext, useEffect, useRef, useState } from "react";
import useConnect from "@/hooks/useConnect";
import { useSelector } from "react-redux";
import { RoomEvent, Track } from "livekit-client";
import { useParams } from "next/navigation";
import { getTestRoomId } from "@/utils/testRoom";

// Same name as SONG_LO_TRACK in hooks/useSocketTest.js. Not imported, so the
// listener page does not bundle the whole broadcaster hook.
const SONG_LO_TRACK = 'song-lo';

const LiveContext = createContext();


export const LiveProvider = ({ children, isAdmin = true, isCall = false }) => {
    const { user } = useSelector(store => store.user);
    const { isConnected, roomRef, connect, participantCount, setParticipantCount } = useConnect(isAdmin);
    const [isLive, setIsLive] = useState(false);
    const [roomActive, setRoomActive] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
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
            // The broadcaster publishes the song twice (song-hd and song-lo).
            // Playing both doubles the song, so listen to song-hd only.
            if (publication.trackName === SONG_LO_TRACK) {
                publication.setSubscribed(false);
                return;
            }
            handleTrackSubscribed(track);

        });

        roomRef.current.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);
            track.detach().forEach(el => el.remove());


            if (participant.identity == "admin" && track.source == Track.Source.Microphone) {
                setRoomActive(false);
                setIsLive(false);
            }
        });

    }, [roomRef.current]);


    // The TrackSubscribed handler is registered once, so it must read isPlaying
    // through a ref. Reading the state there always saw the first-render false,
    // and song tracks (published only when the DJ plays the first song) arrived
    // after the listener pressed Play and were never started.
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    function handleTrackSubscribed(track) {
        const audioElement = document.createElement('audio');
        track.attach(audioElement);
        document.body.appendChild(audioElement);
        if (isPlayingRef.current) {
            audioElement.play()?.catch(() => { });
        }
    }

    useEffect(() => {
        // Station accounts have no originalId; they used to never connect here,
        // so every song failed with LiveKit "not connected".
        const testRoomId = getTestRoomId(user);
        if (isAdmin && testRoomId) {
            connect(testRoomId);
        }

        if (!isAdmin) {
            connect(streamId);
        }
    }, [user, streamId]);

    return (
        <LiveContext.Provider value={{ isConnected, roomRef, participantCount, isLive, setIsLive, roomActive, setRoomActive, isPlaying, setIsPlaying }}>
            {children}
        </LiveContext.Provider>
    )
}

export const useLive = () => {
    return useContext(LiveContext);
}
