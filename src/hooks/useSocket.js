import { io } from 'socket.io-client';
import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Peer from 'simple-peer';
import axios from 'axios';
import { data } from 'autoprefixer';
import hark from 'hark';
import { toast } from 'react-toastify';
import { Track, AudioPresets } from 'livekit-client';
import { useLive } from '@/context/LiveContext';


// Track names used for the adaptive (per-listener network) music streams.
export const SONG_HD_TRACK = 'song-hd';
export const SONG_LO_TRACK = 'song-lo';

// HD music: 128 kbps stereo + RED. For listeners with good/excellent network.
const MUSIC_HD_PUBLISH_OPTIONS = {
	red: true,
	dtx: false,
	forceStereo: true,
	audioPreset: { ...AudioPresets.musicHighQualityStereo, priority: 'high' },
};

// Low music: 48 kbps mono + RED. For listeners on weak/poor network.
const MUSIC_LO_PUBLISH_OPTIONS = {
	red: true,
	dtx: false,
	forceStereo: false,
	audioPreset: { ...AudioPresets.music, priority: 'high' },
};

// Filter/FX: single quality is fine (short clips). Reuse HD preset.
const MUSIC_PUBLISH_OPTIONS = MUSIC_HD_PUBLISH_OPTIONS;

// Mic (voice): DTX off. DTX lets the browser jitter buffer grow during
// pauses and the DJ's voice then lags behind the music.
const MIC_PUBLISH_OPTIONS = {
	red: true,
	dtx: false,
	audioPreset: { ...AudioPresets.musicHighQuality, priority: 'high' },
};

// Map a track name to its publish options.
const publishOptionsForTrack = (name) => {
	if (name === SONG_HD_TRACK) return MUSIC_HD_PUBLISH_OPTIONS;
	if (name === SONG_LO_TRACK) return MUSIC_LO_PUBLISH_OPTIONS;
	return MUSIC_PUBLISH_OPTIONS;
};



const peerConfig = {
	iceTransportPolicy: "relay",
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun.l.google.com:5349" },
		{ urls: "stun:stun1.l.google.com:3478" },
		{ urls: "stun:stun1.l.google.com:5349" },
		{ urls: "stun:stun2.l.google.com:19302" },
		{ urls: "stun:stun2.l.google.com:5349" },
		{ urls: "stun:stun3.l.google.com:3478" },
		{ urls: "stun:stun3.l.google.com:5349" },
		{ urls: "stun:stun4.l.google.com:19302" },
		{ urls: "stun:stun4.l.google.com:5349" },
		{
			urls: "turn:24.199.119.194:3478",
			username: "test",
			credential: "test123",
		},
		{
			urls: "turn:global.relay.metered.ca:80",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turn:global.relay.metered.ca:80?transport=tcp",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turn:global.relay.metered.ca:443",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turns:global.relay.metered.ca:443?transport=tcp",
			username: "827d3072e5b2f0e84207f45a",
			credential: "wmxXXuDm8VSalqWu",
		},
		{
			urls: "turns:relay1.expressturn.com:3478",
			username: "efZL51SQ640A85CEFE",
			credential: "QWATvGdKMEWFRCgg",
		},

	]
}




// const peerConfig = {
// 	iceServers: [
// 		{
// 			urls: "stun:stun.relay.metered.ca:80",
// 		},
// 		{
// 			urls: "turn:global.relay.metered.ca:80",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 		{
// 			urls: "turn:global.relay.metered.ca:80?transport=tcp",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 		{
// 			urls: "turn:global.relay.metered.ca:443",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 		{
// 			urls: "turns:global.relay.metered.ca:443?transport=tcp",
// 			username: "827d3072e5b2f0e84207f45a",
// 			credential: "wmxXXuDm8VSalqWu",
// 		},
// 	]
// }



const socketInit = () => {
	const options = {
		'force new connection': true,
		reconnectionAttempt: 'Infinity',
		timeout: 10000,
		transform: ['websocket']
	}

	return io(process.env.NEXT_PUBLIC_SOCKET_URL, options);
}

const sleep = ms => new Promise(r => window.setTimeout(r, ms))

// Auto Adjust (voice ducking). While the DJ speaks, the song bus drops to
// DUCK_LEVEL of the deck volume and the mic gets MIC_BOOST. When the DJ goes
// quiet for DUCK_RELEASE_MS, both return to the levels the DJ set.
const DUCK_LEVEL = 0.3;
const MIC_BOOST = 1.25;
const DUCK_RELEASE_MS = 800;




const useSocket = (setSongPlaying, songPlaying, selectPlayListSong, selectedSong, setSeletedSong, volume, micVolume, filterPlaying, chatMessage, setChatMessage, setUnread, chatOpen, nextSong, setHistory, handleSelectedSong, handlePlayWelcome, handlePlayEnd, handleWelcomeTonePlayed, handleEndTonePlayed, roomRef, setActive) => {
	const socketRef = useRef();
	const { user } = useSelector(store => store.user);
	const { connectForLive, disconnect: disconnectLiveKit } = useLive();
	const peersRef = useRef({});
	const localStreamRef = useRef();
	const songSourceRef = useRef();
	const constantref = useRef();
	const songStreamRef = useRef(null);
	const gainNodeRef = useRef();
	const localTrackRef = useRef();
	const [micOn, setMicOn] = useState(false);
	// Why the microphone is not working, in the DJ's words; '' when fine.
	const [micNotice, setMicNotice] = useState('');
	// Message from the backend reconciler ('reconcile-not-publishing'); '' when fine.
	const [backendNotice, setBackendNotice] = useState('');
	const [requests, setRequests] = useState([]);
	const [listners, setListners] = useState([]);
	const [newUser, setNewUser] = useState([]);
	const [sduration, setsduration] = useState(0);
	const [remaining, setRemaining] = useState(0);
	const [progress, setProgress] = useState(0);
	const [fprogress, setFProgress] = useState(0);
	const [fremaining, setFRemaining] = useState(0);
	const [fduration, setfduration] = useState(0);
	const [songStreamloading, setSongStreamLoading] = useState(false);
	const songStreamLoadingRef = useRef(false);
	const [filterStreamloading, setFilterStreamLoading] = useState(false);
	const filterStreamLoadingRef = useRef(false);
	const [voiceComing, setVoiceComing] = useState(false);
	const recordMediaRef = useRef();
	const [continuePlay, setContinuePlay] = useState(true);
	const [autoAdjust, setAutoAdjust] = useState(false);
	const autoAdjustRef = useRef(false);
	const micVolumeRef = useRef(micVolume);
	const voiceSpeakingRef = useRef(false);
	const duckReleaseTimerRef = useRef(null);
	// True between ownerJoin and ownerLeft. Replaying a finished song publishes
	// it to listeners, which must never happen after the show has ended.
	const showLiveRef = useRef(false);
	const [repeatPlaylist, setRepeatPlaylist] = useState(false);
	const [messageList, setMessageList] = useState([]);
	const [filterBase, setFilterBase] = useState(0);
	const [songBase, setSongBase] = useState(0);
	const [callerId, setCallerId] = useState('');
	const [callComing, setcallComing] = useState(false);
	const [callerName, setCallerName] = useState('');
	const [callers, setCallers] = useState([]);
	const [callDataChange, setCallDataChange] = useState(false);
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
	const compressorRef = useRef();
	const offAutoLevelingRef = useRef();


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
	const speechEventsRef = useRef();
	const micStreamRef = useRef();
	const [recordReady, setRecordingReady] = useState(false);


	const songAnalyserRef = useRef();
	const filterAnalyserRef = useRef();
	const callerStreamsRef = useRef({});
	const callerDetailsRef = useRef({});
	const callsElementRef = useRef(null);
	const nextSongRef = useRef({});
	const socketListnerRef = useRef(null);
	const breakLookRef = useRef(false);
	const songAnimationFrameIdRef = useRef(null);
	const filterAnimationFrameIdRef = useRef(null);
	const masterAudioContextRef = useRef(null);
	const songObjectUrlRef = useRef(null);
	const filterObjectUrlRef = useRef(null);
	const playSongGenerationRef = useRef(0);
	// One MediaStreamDestination per bus for the whole show. Replacing the
	// WebRTC track on every song resets the listener jitter buffer and the
	// delay grows (the stream falls further behind live).
	const songOutputRef = useRef(null);
	const filterOutputRef = useRef(null);
	const songNodesRef = useRef(null);
	const filterNodesRef = useRef(null);
	const songAudioIdRef = useRef(0);
	const filterAudioIdRef = useRef(0);
	const songTracksPublishedRef = useRef(false);
	const filterTrackPublishedRef = useRef(false);
	const micAudioContextRef = useRef(null);






	useEffect(() => {
		selectPlayListSongRef.current = selectPlayListSong;
	}, [selectPlayListSong]);

	useEffect(() => {
		continuePlayRef.current = continuePlay;
	}, [continuePlay])

	useEffect(() => {
		repeatPlaylistRef.current = repeatPlaylist;
	}, [repeatPlaylist])

	useEffect(() => {
		micVolumeRef.current = micVolume;
	}, [micVolume])

	useEffect(() => {
		autoAdjustRef.current = autoAdjust;
		applyVoiceDuck();
	}, [autoAdjust])

	useEffect(() => {
		recordMediaRef.current = new MediaStream();
		mediaRecorderRef.current = new MediaRecorder(recordMediaRef.current);
		setRecordingReady(true);
	}, [])

	useEffect(() => {
		chatOpenRef.current = chatOpen;
	}, [chatOpen])

	useEffect(() => {
		volumeRef.current = volume;
	}, [volume])

	useEffect(() => {
		selectedSongRef.current = selectedSong;
	}, [selectedSong]);

	useEffect(() => {
		songPlayRef.current = songPlaying;
	}, [songPlaying])

	useEffect(() => {
		filterPlayingRef.current = filterPlaying;
	}, [filterPlaying]);


	useEffect(() => {
		if (nextSong) {
			nextSongRef.current = nextSong;
		} else {
			nextSongRef.current = { title: 'End Song' };
		}
	}, [nextSong])




    const replaceTrack = async (track, name) => {
		const options = publishOptionsForTrack(name);
		try {
			const publications = Array.from(
				roomRef.current.localParticipant.trackPublications.values()
			);
			const publication = publications.find(
				pub => pub.trackName === name
			);
			
			if (publication && publication.track) {
				// Seamless replacement — swap underlying MediaStreamTrack without unpublish/publish
				// This avoids any audio gap for listeners
				const sender = publication.track.sender;
				if (sender) {
					await sender.replaceTrack(track);
					console.log(`✅ Seamlessly replaced track: ${name}`);
				} else {
					// Fallback: if sender not available, do unpublish/publish
					console.warn(`⚠️ No sender found for ${name}, falling back to unpublish/publish`);
					await roomRef.current.localParticipant.unpublishTrack(publication.track);
					await roomRef.current.localParticipant.publishTrack(track, {
						...options,
						source: Track.Source.Unknown,
						name: name
					});
				}
			} else {
				// First time publishing this track
				await roomRef.current.localParticipant.publishTrack(track, {
					...options,
					source: Track.Source.Unknown,
					name: name
				});
				console.log(`✅ Published new track: ${name}`);
			}
		} catch (error) {
			console.error(`❌ Error replacing track ${name}:`, error);
			// Last resort fallback
			try {
				await roomRef.current.localParticipant.publishTrack(track, {
					...options,
					source: Track.Source.Unknown,
					name: name
				});
			} catch (e) {
				console.error(`❌ Fallback publish also failed:`, e);
			}
		}
	}





	function AudioProcessSongFilter(isFilter) {
		let analyser;

		if (isFilter) {
			analyser = filterAnalyserRef.current
		} else {
			analyser = songAnalyserRef.current
		}

		if (!analyser) return;

		if (isFilter && !filterPlayingRef.current) {
			setFilterBase(0)
			return
		}

		if (!isFilter && !songPlayRef.current) {
			setSongBase(0);
			return
		}

		const array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);
		const arraySum = array.reduce((a, value) => a + value, 0);
		const average = arraySum / array.length;
		// console.info('voulme',Math.round(average));
		// colorPids(average);
		const voiceVolume = Math.round(average);
		if (isFilter) {
			setFilterBase(voiceVolume);
		} else {
			setSongBase(voiceVolume);
		}
	}


	
	// function getSongStream(songUrl, gainNodeRef, songSourceRef, volume, audioContextRef, progress, progressCallback, setduration, isFilter = false) {
	// 	return fetch(songUrl)
	// 		.then(response => response.arrayBuffer())
	// 		.then(arrayBuffer => {
	// 			return new Promise((resolve, reject) => {
	// 				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
	// 				audioContext.decodeAudioData(arrayBuffer, buffer => {

	// 					const gainNode = audioContext.createGain();
	// 					gainNode.connect(audioContext.destination);
	// 					gainNode.gain.value = volume;

	// 					gainNodeRef.current = gainNode



	// 					const createSource = () => {
	// 						const source = audioContext.createBufferSource();
	// 						source.buffer = buffer;
	// 						source.connect(gainNode);
	// 						songSourceRef.current = source;
	// 						return source;
	// 					}

	// 					let source = createSource();





	// 					audioContextRef.current = audioContext;
	// 					let startTime = audioContext.currentTime;
	// 					setduration(Math.floor(source.buffer.duration));
	// 					console.info('startTime', startTime)
	// 					breakLookRef.current = true;
	// 					const updateProgess = () => {
	// 						const currentTime = audioContext.currentTime;
	// 						const duration = source.buffer.duration;
	// 						const progress = {
	// 							currentTime,
	// 							duration,
	// 							percentage: (currentTime / duration) * 100,
	// 							remainTime: duration - currentTime,
	// 						}
	// 						progressCallback(progress);


	// 						if (isFilter) {
	// 							if (currentTime < duration && filterPlayingRef.current) {
	// 									requestAnimationFrame(updateProgess);
	// 							} else {
	// 								if (filterPlayingRef.current && isFilter) {
	// 									console.log('next filter');
	// 									// pending auto play filter 
	// 								}
	// 							}
	// 						} else {


	// 							if (currentTime < duration && songPlayRef.current) {
	// 								if(breakLookRef.current == true){
	// 									requestAnimationFrame(updateProgess);
	// 								}else{
	// 									console.log('break look ref', breakLookRef.current);
	// 								}
	// 							} else {
	// 								if (songPlayRef.current && !isFilter && continuePlayRef.current === true) {
	// 									const sindex = selectPlayListSongRef.current?.songs?.indexOf(selectedSongRef.current);
	// 									if (sindex >= selectPlayListSongRef.current?.songs?.length - 1) {
	// 										if (repeatPlaylistRef.current) {
	// 											// const song = selectPlayListSongRef.current?.songs[0];
	// 											// setSeletedSong(song);
	// 											// setSongPlaying(true);
	// 											// setProgress(0);
	// 											// playSong(song.audio,volumeRef.current);
	// 											setSongPlaying(false);
	// 											setProgress(0);
	// 										} else {
	// 											setSongPlaying(false);
	// 											setProgress(0)
	// 										}

	// 									} else {
	// 										const song = selectPlayListSongRef.current?.songs[sindex + 1];

	// 										handleSelectedSong(song, sindex);
	// 										// setSeletedSong(song);
	// 										// setSongPlaying(true);
	// 										// setProgress(0);
	// 										// playSong(song.audio,volumeRef.current);
	// 									}
	// 								}
	// 							}
	// 						}

	// 					}

	// 					const changeCurrentTime = async (newTime) => {
	// 						if (newTime >= 0 && newTime <= source.buffer.duration) {
	// 							source.stop();
	// 							source = createSource();
	// 							source.start(0, newTime, audioContext.buffer.duration);
	// 							audioContext.resume();
	// 							performance.now();
	// 						}
	// 					}


	// 					source.start();
	// 					updateProgess();



	// 					const songStream = audioContext.createMediaStreamDestination();


	// 					source.connect(songStream);


	// 					const analyseraudioContext = new (window.AudioContext || window.webkitAudioContext)();
	// 					const audio = analyseraudioContext.createMediaStreamSource(songStream.stream);
	// 					//deteting the audio
	// 					const analyser = analyseraudioContext.createAnalyser();
	// 					const scriptProcessor = analyseraudioContext.createScriptProcessor(2048, 1, 1);
	// 					analyser.smoothingTimeConstant = 0.8;
	// 					analyser.fftSize = 1024;
	// 					if (isFilter) {
	// 						filterAnalyserRef.current = analyser;
	// 					} else {
	// 						songAnalyserRef.current = analyser;
	// 					}


	// 					audio.connect(analyser);
	// 					analyser.connect(scriptProcessor);
	// 					scriptProcessor.connect(analyseraudioContext.destination);

	// 					scriptProcessor.addEventListener('audioprocess', () => AudioProcessSongFilter(isFilter));


	// 					resolve({ songStream: songStream.stream, changeCurrentTime });
	// 				}, reject);
	// 			});
	// 		})
	// 		.then(songStream => {
	// 			console.log(songStream);
	// 			return songStream;
	// 		})
	// 		.catch(error => console.error('Error loading song:', error));
	// }





	// function getSongStream(songUrl, gainNodeRef, songSourceRef, volume, audioContextRef, progress, progressCallback, setduration, isFilter = false) {
	// 	return new Promise((resolve, reject) => {
	// 		const audio = new Audio("/audio/audip.mp3");
	// 		audio.addEventListener('canplaythrough', () => {
	// 			const stream = audio.captureStream()

	// 			//create audio context and gain node
	// 			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
	// 			const gainNode = audioContext.createGain();
	// 		    gainNode.connect(audioContext.destination);
	// 		    gainNode.gain.value = volume;
	// 	     	gainNodeRef.current = gainNode

	// 			//create source
	// 			const source = audioContext.createMediaStreamSource(stream);
	// 			source.connect(gainNode);
	// 			songSourceRef.current = audio;


	// 			audioContextRef.current = audioContext;
	// 			setduration(Math.floor(audio.duration));


	// 			audio.addEventListener('timeupdate', () => {
	// 				const currentTime = audio.currentTime;
	// 				const duration = audio.duration;
	// 				const progress = {
	// 					currentTime,
	// 					duration,
	// 					percentage: (currentTime / duration) * 100,
	// 					remainTime: duration - currentTime,
	// 				}
	// 				progressCallback(progress);
	// 			});


	// 			audio.addEventListener('ended', () => {
	// 				if(isFilter) {
	// 					if(filterPlayingRef.current) {
	// 						console.log('next filter');
	// 						// pending auto play filter 
	// 					}
	// 				} else {
	// 					if (songPlayRef.current && !isFilter && continuePlayRef.current === true) {
	// 						const sindex = selectPlayListSongRef.current?.songs?.indexOf(selectedSongRef.current);
	// 						if (sindex >= selectPlayListSongRef.current?.songs?.length - 1) {
	// 							if (repeatPlaylistRef.current) {
	// 								setSongPlaying(false);
	// 								setProgress(0);
	// 							} else {
	// 								setSongPlaying(false);
	// 								setProgress(0)
	// 							}
	// 						}
	// 					} else {
	// 						const song = selectPlayListSongRef.current?.songs[sindex + 1];
	// 						handleSelectedSong(song, sindex);
	// 					}
						
	// 				}
	// 			})
			
				
	// 			const songStream = audioContext.createMediaStreamDestination();
	// 			source.connect(songStream);

	// 			//create analyser
	// 			const analyser = audioContext.createAnalyser();
	// 			analyser.smoothingTimeConstant = 0.8;
	// 			analyser.fftSize = 1024;

	// 			//connect source to analyser
	// 			source.connect(analyser);
	// 			analyser.connect(audioContext.destination);

	// 			if(isFilter) {
	// 				filterAnalyserRef.current = analyser;
	// 			} else {
	// 				songAnalyserRef.current = analyser;
	// 			}

	// 			//script processor
	// 			const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
	// 			analyser.connect(scriptProcessor);
	// 			scriptProcessor.connect(audioContext.destination);
	// 			scriptProcessor.addEventListener('audioprocess', () => AudioProcessSongFilter(isFilter));

				

	// 			const changeCurrentTime = (newTime) => {
	// 				audio.currentTime = newTime
	// 			}

			
	// 			audio.play();
	// 			resolve({ songStream: songStream.stream, changeCurrentTime})
	// 		})
	// 	})
	// }

   async function getObjectUrlFromAudio(audioUrl) {
	try {
		// 1. Fetch audio as buffer
		const response = await fetch(audioUrl);
		if (!response.ok) throw new Error("Failed to fetch audio");

		const arrayBuffer = await response.arrayBuffer();

		// 2. Convert to Blob
		const blob = new Blob([arrayBuffer], {
		type: response.headers.get("content-type") || "audio/mpeg",
		});

		// 3. Create Object URL
		const objectUrl = URL.createObjectURL(blob);

		return objectUrl;
	} catch (err) {
		console.error("Audio fetch error:", err);
		throw err;
	}
	}

	function createLowLatencyContext() {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		try {
			return new Ctx({ latencyHint: 'interactive', sampleRate: 48000 });
		} catch (e) {
			return new Ctx({ latencyHint: 'interactive' });
		}
	}

	// Helper: get or create the single master AudioContext for the session.
	// 48 kHz matches Opus/WebRTC so the browser does not resample, and
	// interactive latency keeps the capture quantum small (~128 samples).
	function getMasterAudioContext() {
		if (!masterAudioContextRef.current || masterAudioContextRef.current.state === 'closed') {
			masterAudioContextRef.current = createLowLatencyContext();
			console.log('🎵 Created master AudioContext');
		}
		// Resume if suspended (browser autoplay policy)
		if (masterAudioContextRef.current.state === 'suspended') {
			masterAudioContextRef.current.resume();
		}
		return masterAudioContextRef.current;
	}

	// Persistent publish bus. Songs/filters only swap the source node;
	// the MediaStreamTrack sent to LiveKit stays the same all session.
	function getOrCreateOutput(isFilter) {
		const slot = isFilter ? filterOutputRef : songOutputRef;
		if (slot.current?.streamDestination) return slot.current;

		const audioContext = getMasterAudioContext();
		const gainNode = audioContext.createGain();
		gainNode.gain.value = 1;
		const streamDestination = audioContext.createMediaStreamDestination();
		const streamDestinationLow = !isFilter
			? audioContext.createMediaStreamDestination()
			: null;

		gainNode.connect(audioContext.destination);
		gainNode.connect(streamDestination);
		if (streamDestinationLow) gainNode.connect(streamDestinationLow);

		slot.current = { audioContext, gainNode, streamDestination, streamDestinationLow };
		return slot.current;
	}

	function stopLevelMeter(isFilter) {
		const frameRef = isFilter ? filterAnimationFrameIdRef : songAnimationFrameIdRef;
		if (frameRef.current) cancelAnimationFrame(frameRef.current);
		frameRef.current = null;
	}

	function startLevelMeter(isFilter) {
		stopLevelMeter(isFilter);
		const frameRef = isFilter ? filterAnimationFrameIdRef : songAnimationFrameIdRef;
		let last = 0;
		const loop = (t) => {
			frameRef.current = requestAnimationFrame(loop);
			if (t - last < 100) return;
			last = t;
			AudioProcessSongFilter(isFilter);
		};
		frameRef.current = requestAnimationFrame(loop);
	}

	function disconnectActiveNodes(isFilter) {
		const nodesRef = isFilter ? filterNodesRef : songNodesRef;
		const nodes = nodesRef.current;
		if (!nodes) return;
		stopLevelMeter(isFilter);
		try { nodes.source?.disconnect(); } catch (e) { /* already disconnected */ }
		try { nodes.analyser?.disconnect(); } catch (e) { /* already disconnected */ }
		nodesRef.current = null;
	}

	async function getSongStream(songUrl, gainNodeRef, songSourceRef, volume, audioContextRef, progress, progressCallback, setduration, isFilter = false, generation = null) {
		let url = songUrl.replace(process.env.NEXT_PUBLIC_SOCKET_URL,'');
		url = await getObjectUrlFromAudio(url);

		// A newer song was picked while this file was still downloading.
		if (!isFilter && generation != null && generation !== playSongGenerationRef.current) {
			URL.revokeObjectURL(url);
			throw new Error('stale song');
		}

		const audioIdRef = isFilter ? filterAudioIdRef : songAudioIdRef;
		const audioId = ++audioIdRef.current;

		return new Promise((resolve, reject) => {
			const audio = new Audio();
			audio.preload = 'auto';
			audio.muted = false;
			audio.crossOrigin = 'anonymous';
			audio.src = url;

			const dropStale = () => {
				try { audio.pause(); audio.src = ''; } catch (e) { /* ignore */ }
				URL.revokeObjectURL(url);
			};

			audio.addEventListener('error', () => {
				dropStale();
				reject(new Error('audio failed to load'));
			}, { once: true });

			// canplay (not canplaythrough) — the file is already a local blob,
			// so waiting for a full-buffer estimate only delays the live cut.
			audio.addEventListener('canplay', () => {
				if (audioId !== audioIdRef.current || (!isFilter && generation != null && generation !== playSongGenerationRef.current)) {
					dropStale();
					return reject(new Error('stale song'));
				}

				const output = getOrCreateOutput(isFilter);
				const audioContext = output.audioContext;

				let source;
				try {
					source = audioContext.createMediaElementSource(audio);
				} catch (error) {
					console.error('Error creating media element source:', error);
					dropStale();
					return reject(error);
				}

				const analyser = audioContext.createAnalyser();
				analyser.smoothingTimeConstant = 0.8;
				analyser.fftSize = 1024;

				// Connect the new song first, then drop the old source, so the
				// published MediaStreamTrack never goes silent between tracks.
				source.connect(analyser);
				analyser.connect(output.gainNode);

				const previousAudio = songSourceRef.current;
				disconnectActiveNodes(isFilter);

				if (previousAudio && previousAudio !== audio) {
					try {
						previousAudio.pause();
						previousAudio.src = '';
					} catch (e) { /* ignore */ }
				}

				const urlRef = isFilter ? filterObjectUrlRef : songObjectUrlRef;
				if (urlRef.current && urlRef.current !== url) {
					URL.revokeObjectURL(urlRef.current);
				}
				urlRef.current = url;

				const nodesRef = isFilter ? filterNodesRef : songNodesRef;
				nodesRef.current = { source, analyser };

				songSourceRef.current = audio;
				audioContextRef.current = audioContext;
				gainNodeRef.current = output.gainNode;
				setduration(Math.floor(audio.duration) || 0);

				if (isFilter) {
					filterAnalyserRef.current = analyser;
				} else {
					songAnalyserRef.current = analyser;
				}

				// VU meter via rAF. ScriptProcessor blocked the audio thread and
				// made the WebRTC jitter buffer grow (stream fell behind live).
				startLevelMeter(isFilter);

				audio.addEventListener('timeupdate', () => {
					const currentTime = audio.currentTime;
					const duration = audio.duration;
					if (!duration) return;
					progressCallback({
						currentTime,
						duration,
						percentage: (currentTime / duration) * 100,
						remainTime: duration - currentTime,
					});
				});

				audio.addEventListener('ended', () => {
					if (audioId !== audioIdRef.current) return;
					console.log('audio ended');
					disconnectActiveNodes(isFilter);

					if (isFilter) {
						if (filterPlayingRef.current) {
							console.log('next filter');
						}
					} else if (songPlayRef.current) {
						// Continuous Play off: stop after this song.
						// On: play the next queued song; after the last one,
						// start over only when Repeat Playlist is ticked.
						const songs = selectPlayListSongRef.current?.songs || [];
						const currentId = selectedSongRef.current?._id?.toString();
						const sindex = songs.findIndex(song => song?._id?.toString() === currentId);
						let nextIndex = -1;
						if (continuePlayRef.current === true && songs.length > 0) {
							if (sindex < 0) nextIndex = 0;
							else if (sindex < songs.length - 1) nextIndex = sindex + 1;
							else if (repeatPlaylistRef.current === true) nextIndex = 0;
						}
						if (nextIndex >= 0) {
							handleSelectedSong(songs[nextIndex], nextIndex);
						} else {
							songPlayRef.current = false;
							setSongPlaying(false);
							setProgress(0);
						}
					}
				});

				const changeCurrentTime = (newTime) => {
					audio.currentTime = newTime;
				};

				audio.play().then(() => {
					resolve({
						songStream: output.streamDestination.stream,
						songStreamLow: output.streamDestinationLow ? output.streamDestinationLow.stream : null,
						changeCurrentTime,
					});
				}).catch((error) => {
					console.error('Error playing audio:', error);
					reject(error);
				});
			}, { once: true });
		});
	}





	

	useEffect(() => {
		micOnRef.current = micOn;
	}, [micOn])


	function handleReceiveMessage(data) {
		const entry = { ...data, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date: Date.now() };
		setMessageList(prev => [...prev, entry]);
		if (chatOpenRef.current === false && !data?.isOwner) {
			setUnread(prev => prev + 1);
			// Same idea as the incoming-call banner: the DJ should not have to open the chat to know.
			toast.info(`💬 ${data?.name || 'A listener'}: ${String(data?.message || '').slice(0, 140)}`, { autoClose: 7000, toastId: entry.id });
		}
	}

	async function handleNewUser(peerId) {
		setNewUser(prev => [...prev, peerId]);
		await sleep(2000);



		const audioContext = new (window.AudioContext || window.webkitAudioContext)();



		const mic = audioContext.createMediaStreamSource(localStreamRef.current);
		const dest = audioContext.createMediaStreamDestination();
		mic.connect(dest);



		if (songStreamRef.current) {
			const song = audioContext.createMediaStreamSource(songStreamRef.current);
			song.connect(dest);
		}

		if (filterStreamRef.current) {
			const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
			filter.connect(dest);
		}

		for (let peerId in callerStreamsRef.current) {
			const userStream = audioContext.createMediaStreamSource(callerStreamsRef.current[peerId]);
			userStream.connect(dest);
		}

		const combinedStream = dest.stream;

		peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'), combinedStream.getTracks()[0], localStreamRef.current);
		// }
	}



	async function addStreamInMain(id) {
		try {
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();

			const mic = audioContext.createMediaStreamSource(localStreamRef.current);


			const dest = audioContext.createMediaStreamDestination();
			mic.connect(dest);

			if (filterStreamRef.current) {
				const filter = audioContext.createMediaStreamSource(filterStreamRef.current);
				filter.connect(dest);
			}

			if (songStreamRef.current) {
				const song = audioContext.createMediaStreamSource(songStreamRef.current);
				song.connect(dest);
			}

			for (let peerId in callerStreamsRef.current) {
				const userStream = audioContext.createMediaStreamSource(callerStreamsRef.current[peerId]);
				userStream.connect(dest);
			}

			const combinedStream = dest.stream;
			// peersRef.current[id].addStream(combinedStream);


			// recording 
			recordMediaRef.current.removeTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'))
			combinedStreamRef.current = combinedStream;
			recordMediaRef.current.addTrack(combinedStreamRef.current.getTracks().find((track) => track.kind === 'audio'));


			Object.keys(peersRef.current).forEach((peerId) => {
				//replace track
				if (peersRef.current[peerId].isCall == false) {

					const audioSender = peersRef.current[peerId].getSenders().find(sender => sender.track && sender.track.kind === "audio");
					if (audioSender && combinedStream.getTracks().length > 0) {
						const newAudioTrack = combinedStream.getTracks()[0];

						// Replace the existing track with the new audi track
						audioSender.replaceTrack(newAudioTrack);
						console.log("✅ Audio track replaced successfully!");
					} else {
						console.warn("⚠️ No audio sender found or new stream has no audio track.");
					}
				}

				// peersRef.current[peerId].replaceTrack(localStreamRef.current.getTracks().find((track) => track.kind === 'audio'), combinedStream.getTracks()[0], localStreamRef.current);
			});
		} catch (error) {

		}

	}


	// const handleOffer = (data) => {
	// 	console.log("offer recieved",data)
	// 	const isCall = data.isCall;
	// 	peersRef.current[data.senderId] = new Peer({ initiator: false, stream: isCall == true ? micStreamRef.current : localStreamRef.current,config: peerConfig });

	// 	peersRef.current[data.senderId].on('signal', answer => {
	// 		console.log('answer', answer);

	// 		socketRef.current.emit('answer', { answer, recieverId: data.senderId });
	// 	});

	// 	peersRef.current[data.senderId].on('connect', () => {
	// 		console.log(data.senderId, songStreamRef.current, micOn);
	// 		console.log('new user come', data.senderId);
	// 		handleNewUser(data.senderId);


	// 		console.log('Connection established');
	// 	});

	// 	peersRef.current[data.senderId].on('data', data => {
	// 		console.log('Received data:', data);
	// 	});

	// 	peersRef.current[data.senderId].on('close', () => {
	// 		console.log('Connection closed');
	// 	});

	// 	peersRef.current[data.senderId].on('error', err => {
	// 		console.error('Peer error:', err);
	// 	});


	// 	// test
	// 	peersRef.current[data.senderId].on('stream', (stream) => {
	// 		console.info('stream coming');
	// 		console.log(stream);
	// 		console.log(peersRef.current[data.senderId].connected);

	// 		callerStreamsRef.current[data.senderId] = stream;
	// 		// callsElementRef.current.srcObject = stream;
	// 		const audio = new Audio();
	// 		audio.srcObject = stream;
	// 		audio.controls = true;
	// 		audio.play()
	// 		// document.getElementById("call-contaier").appendChild(audio);

	// 		// callsElementRef.current.srcObject = stream;
	// 		addStreamInMain(data.senderId);
	// 	});

	// 	peersRef.current[data.senderId].signal(data?.offer);

	// }


	const handleOffer = async (data) => {
		if (!peersRef.current[data.senderId]) {
			peersRef.current[data.senderId] = new RTCPeerConnection(peerConfig);

			//on ice candidate
			peersRef.current[data.senderId].onicecandidate = (event) => {
				if (event.candidate) {
					const answer = {
						type: "candidate",
						content: event.candidate
					}
					socketRef.current.emit('answer', { answer, recieverId: data.senderId });
				}
			};

			//ontrack
			peersRef.current[data.senderId].ontrack = (event) => {
				const stream = event.streams[0];
				console.info('stream coming', stream);

				callerStreamsRef.current[data.senderId] = stream;
				const audio = new Audio();
				audio.srcObject = stream;
				audio.controls = true;
				audio.play();
				addStreamInMain(data.senderId);
			}


			//on connection state changed
			peersRef.current[data.senderId].onconnectionstatechange = () => {
				console.log("Connection State Changed:", peersRef.current[data.senderId]?.connectionState);
			}

			peersRef.current[data.senderId].onnegotiationneeded = async () => {
				console.log("🛑 Negotiation needed!");

				try {
					const offer = await peersRef.current[data.senderId].createOffer();
					await peersRef.current[data.senderId].setLocalDescription(offer);
					const answer = {
						type: "offer",
						content: offer
					}
					socketRef.current.emit('answer', { answer, recieverId: data.senderId });
					console.log("✅ Sent new offer due to negotiation.");
				} catch (error) {
					console.error("Error during renegotiation:", error);
				}
			};

			//when is call true
			const isCall = data.isCall;
			if (isCall) {
				peersRef.current[data.senderId].isCall = true;
				micStreamRef.current.getTracks().forEach(track => {
					peersRef.current[data.senderId].addTrack(track, micStreamRef.current);
				});
			} else {
				peersRef.current[data.senderId].isCall = false;
				combinedStreamRef.current.getTracks().forEach(track => {
					peersRef.current[data.senderId].addTrack(track, combinedStreamRef.current);
				});
			}
		}


		const signal = data.offer;

		if (signal.type == "answer") {
			peersRef.current[data.senderId].setRemoteDescription(new RTCSessionDescription(signal.content))
		}

		if (signal.type == "candidate") {
			peersRef.current[data.senderId].addIceCandidate(new RTCIceCandidate(signal.content));
		}

		if (signal.type == "offer") {
			peersRef.current[data.senderId].setRemoteDescription(new RTCSessionDescription(signal.content))

			const answerContent = await peersRef.current[data.senderId].createAnswer();
			await peersRef.current[data.senderId].setLocalDescription(answerContent);

			const answer = {
				type: "answer",
				content: answerContent
			}
			socketRef.current.emit('answer', { answer, recieverId: data.senderId });
		}



	}




	function progressCallback(progress) {
		setRemaining(Math.floor(progress.remainTime));
		setProgress(Math.floor(progress.currentTime));
		// console.info('progress',progress);
	}

	function handleProgressChange(type,value) {
		
		if(type == "song") {
			changeCurrentTimeRef.current(value)
		}
		if(type == "filter") {
			filterchangeCurrentTimeRef.current(value)
		}
	}

	function broadcastSongToListeners(currentSong, nextSong) {
		if (!currentSong) return;

		selectedSongRef.current = currentSong;
		if (nextSong) {
			nextSongRef.current = nextSong;
		}
		// Only the DJ's name travels with the song: this payload is broadcast to
		// every listener, and the full record carries fields that must not leave the panel.
		nextSongRef.current.user = user ? { _id: user._id, name: user.name, avatar: user.avatar } : undefined;

		socketRef.current?.emit('next-song', {
			roomId: user?._id?.toString(),
			nextSong: nextSongRef.current,
			currentSong: selectedSongRef.current,
		});
	}

	async function playSong(url, volume, songMeta = null) {
		console.log(url);

		// Each new selection gets a generation id so an in-flight load can be
		// cancelled when the DJ picks another song from the queue mid-load.
		const generation = ++playSongGenerationRef.current;

		if (songMeta?.currentSong) {
			broadcastSongToListeners(songMeta.currentSong, songMeta.nextSong);
		}

		breakLookRef.current = false;

		setSongStreamLoading(true);
		songStreamLoadingRef.current = true;

		try {
			let { songStream, songStreamLow, changeCurrentTime } = await getSongStream(url, gainNodeRef, songSourceRef, volume, audioContextRef, progress, progressCallback, setsduration, false, generation);

			// A newer song was selected while this one was still loading.
			if (generation !== playSongGenerationRef.current) {
				return;
			}

			changeCurrentTimeRef.current = changeCurrentTime;

			console.log(songStream,"songStream")

			songStreamRef.current = songStream;

			setSongStreamLoading(false);
			songStreamLoadingRef.current = false;

			// Publish once. Later songs reuse the same MediaStreamTrack so
			// listeners do not rebuffer or accumulate delay on every cut.
			if (!songTracksPublishedRef.current) {
				songTracksPublishedRef.current = true;
				try {
					await replaceTrack(songStream.getAudioTracks()[0], SONG_HD_TRACK);
					if (songStreamLow) {
						await replaceTrack(songStreamLow.getAudioTracks()[0], SONG_LO_TRACK);
					}
				} catch (publishError) {
					songTracksPublishedRef.current = false;
					throw publishError;
				}
			}

		} catch (err) {
			if (generation === playSongGenerationRef.current) {
				setSongStreamLoading(false);
				songStreamLoadingRef.current = false;
			}
			console.error('error : ', err.message)
		}
	}

	const pauseSong = () => {
		if (songSourceRef.current?.pause) {
			songSourceRef.current.pause();
		}
	}

	const resumeSong = () => {
		const audio = songSourceRef.current;
		// A song that already ended has been unplugged from the broadcast,
		// so play it again from the start instead of resuming the dead element.
		if (!audio || audio.ended || !songNodesRef.current) {
			if (!showLiveRef.current) return;
			const song = selectedSongRef.current;
			if (song?.audio) {
				playSong(song.audio, volumeRef.current, { currentSong: song, nextSong: nextSongRef.current });
			}
			return;
		}
		audio.play();
	}

	// Duck the song and lift the mic while the DJ talks (Auto Adjust ticked).
	function applyVoiceDuck() {
		const duck = autoAdjustRef.current && micOnRef.current && voiceSpeakingRef.current;

		const songBus = songOutputRef.current;
		if (songBus?.gainNode && songBus.audioContext?.state !== 'closed') {
			const gain = songBus.gainNode.gain;
			const now = songBus.audioContext.currentTime;
			gain.cancelScheduledValues(now);
			gain.setValueAtTime(gain.value, now);
			// Fast attack so the first words are heard, slow release so the song fades back.
			gain.setTargetAtTime(duck ? DUCK_LEVEL : 1, now, duck ? 0.05 : 0.35);
		}

		const micGain = micGainNodeRef.current;
		const micCtx = micAudioContextRef.current;
		if (micGain && micCtx && micCtx.state !== 'closed') {
			const target = Number(micVolumeRef.current) * (duck ? MIC_BOOST : 1);
			const now = micCtx.currentTime;
			micGain.gain.cancelScheduledValues(now);
			micGain.gain.setValueAtTime(micGain.gain.value, now);
			micGain.gain.setTargetAtTime(target, now, 0.05);
		}
	}

	function handleVoiceActivity(speaking) {
		if (duckReleaseTimerRef.current) {
			clearTimeout(duckReleaseTimerRef.current);
			duckReleaseTimerRef.current = null;
		}
		if (speaking) {
			voiceSpeakingRef.current = true;
			applyVoiceDuck();
			return;
		}
		// Short pauses between words should not pump the music up and down.
		duckReleaseTimerRef.current = setTimeout(() => {
			duckReleaseTimerRef.current = null;
			voiceSpeakingRef.current = false;
			applyVoiceDuck();
		}, DUCK_RELEASE_MS);
	}

	const changeValume = (value) => {
		// Volume is applied on the HTMLMediaElement, which scales the signal
		// entering the Web Audio graph (both local playback and the published stream).
		if (songSourceRef.current) {
			songSourceRef.current.volume = value;
		}
	}


	// filter functions


	function filterprogressCallback(progress) {
		// console.log('filter progress',progress)
		setFRemaining(Math.floor(progress.remainTime));
		setFProgress(Math.floor(progress.currentTime));
		// console.info('progress',progress);
	}

	async function playFilter(url, volume) {
		console.log(url);

		// FIX: Use ref instead of state to avoid stale closure
		if (filterStreamLoadingRef.current) {
			console.log('filter loading is true — skipping');
			return
		}

		setFilterStreamLoading(true);
		filterStreamLoadingRef.current = true;

		try {
			let { songStream, changeCurrentTime } = await getSongStream(url, filterGainNodeRef, filterSourceRef, volume, filtterAudioContextRef, fprogress, filterprogressCallback, setfduration, true);
			filterchangeCurrentTimeRef.current = changeCurrentTime;

			// FIX: Publish the filter's MediaStreamDestination directly (see playSong).
			// Removing the redundant second MediaStream hop prevents intermittent dropouts.
			filterStreamRef.current = songStream;

			setFilterStreamLoading(false);
			filterStreamLoadingRef.current = false;

			if (!filterTrackPublishedRef.current) {
				filterTrackPublishedRef.current = true;
				try {
					await replaceTrack(filterStreamRef.current.getAudioTracks()[0], 'filter');
				} catch (publishError) {
					filterTrackPublishedRef.current = false;
					throw publishError;
				}
			}

		} catch (err) {
			setFilterStreamLoading(false);
			filterStreamLoadingRef.current = false;
			console.error('error : ', err.message)
		}
	}


	const pauseFilter = () => {
		if (filterSourceRef.current?.pause) {
			filterSourceRef.current.pause();
		}
	}

	const changeFilterValume = (value) => {
		if (filterSourceRef.current) {
			filterSourceRef.current.volume = value;
		}
	}

	const changeMicValume = (value) => {
		micVolumeRef.current = value;
		if (micGainNodeRef.current?.gain) {
			const duck = autoAdjustRef.current && micOnRef.current && voiceSpeakingRef.current;
			const gain = micGainNodeRef.current.gain;
			const now = micAudioContextRef.current?.currentTime ?? 0;
			gain.cancelScheduledValues(now);
			gain.setValueAtTime(Number(value) * (duck ? MIC_BOOST : 1), now);
		}
	}


	// Why getUserMedia failed, in words the DJ can act on.
	function micErrorMessage(err) {
		const name = err?.name || '';
		if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
			return 'Microphone permission was not given. Click the lock (or camera/mic) icon in the browser address bar, allow the microphone, then press the mic button here.';
		}
		if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No microphone was found on this device. Plug one in (or check your headset), then press the mic button.';
		if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'The microphone is busy or not working (another app may be using it). Close other apps using the mic, then press the mic button.';
		if (name === 'OverconstrainedError') return 'The microphone does not support the requested settings. Try a different microphone.';
		return `Microphone could not be started (${err?.message || name || 'unknown error'}). Press the mic button to try again.`;
	}

	async function requestMic() {
		if (!navigator?.mediaDevices?.getUserMedia) {
			return { stream: null, error: 'This browser cannot access the microphone (needs https and a modern browser).' };
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, latency: 0 },
			});
			return { stream, error: null };
		} catch (err) {
			console.warn('getUserMedia failed:', err?.name, err?.message);
			return { stream: null, error: micErrorMessage(err) };
		}
	}

	// Wire a microphone stream into voice detection, the mic gain bus, the
	// recording and the LiveKit publication. Used at Go Live and when the DJ
	// turns the mic on later (e.g. after granting permission).
	function attachMic(stream) {
		try { speechEventsRef.current?.stop(); } catch (e) { /* none */ }
		speechEventsRef.current = hark(stream, { threshold: -50 });
		speechEventsRef.current.on('speaking', () => {
			setVoiceComing(true);
			handleVoiceActivity(true);
		});
		speechEventsRef.current.on('stopped_speaking', () => {
			setVoiceComing(false);
			handleVoiceActivity(false);
		});

		micStreamRef.current = stream;
		const audioContext = createLowLatencyContext();
		micAudioContextRef.current = audioContext;
		const mic = audioContext.createMediaStreamSource(stream);
		const dest = audioContext.createMediaStreamDestination();
		const micGainNode = audioContext.createGain();
		mic.connect(micGainNode);
		micGainNode.connect(dest);
		micGainNode.gain.value = Number(micVolumeRef.current);
		micGainNodeRef.current = micGainNode;
		localStreamRef.current = dest.stream;

		const micTrack = dest.stream.getTracks().find((track) => track.kind === 'audio');
		combinedStreamRef.current = dest.stream;
		try { recordMediaRef.current?.addTrack(micTrack); } catch (e) { /* recorder not ready */ }

		const lp = roomRef.current?.localParticipant;
		if (lp && micTrack) {
			lp.publishTrack(micTrack, { ...MIC_PUBLISH_OPTIONS, source: Track.Source.Microphone })
				.catch((err) => {
					console.error('mic publish failed:', err);
					setMicNotice(`Microphone could not be sent to listeners (${err?.message || err}). Press the mic button to try again.`);
				});
		}
		setMicOn(true);
		micOnRef.current = true;
		setMicNotice('');
	}

	const SwitchOn = async () => {
		if (!localStreamRef.current) {
			// The show started without a microphone (permission refused, no device, busy). Try again now.
			if (!showLiveRef.current) { toast.info('Press the power button to start first.'); return; }
			const { stream, error } = await requestMic();
			if (!stream) { setMicNotice(error); toast.error(error, { autoClose: 12000 }); return; }
			attachMic(stream);
			applyVoiceDuck();
			return;
		}
		if (micOn) {
			localStreamRef.current.getTracks().forEach(track => track.enabled = false);
			setMicOn(false);
			micOnRef.current = false;
		} else {
			setMicOn(true);
			micOnRef.current = true;
			localStreamRef.current.getTracks().forEach(track => track.enabled = true);
		}
		// A muted mic must never keep the music ducked.
		applyVoiceDuck();
	}

	useEffect(() => {
		socketRef.current?.on('recieve-request-song', (data) => {
			console.log('requests', data);
			setRequests(prev => [...prev, data]);
		});

		socketRef.current?.on('user-disconnet', ({ id }) => {
			console.log('disconnect', id);
			if (peersRef.current[id]) {
				delete peersRef.current[id];
			}

			if (callerDetailsRef.current[id]) {
				delete callerDetailsRef.current[id];
				delete callerStreamsRef.current[id];
				addStreamInMain(id);
				setCallDataChange(prev => !prev);
				setcallComing(false);
			}
			setNewUser(prev => prev.filter(peerId => peerId != id));
		})

		socketRef.current?.on('receive-message', handleReceiveMessage);

		socketRef.current?.on('call-coming', (data) => {
			setCallerId(data.callerID);
			setcallComing(true);
			setCallerName(data.name);
			// peersRef.current[data.callerID].on('stream',(stream) => {
			// 	window.alert(5);
			// })
		})

		socketRef.current?.on('cut-admin', (data) => {
			delete callerDetailsRef.current[data.callerID];
			delete callerStreamsRef.current[data.callerID];
			addStreamInMain(data.callerID);
			setCallDataChange(prev => !prev);
			setcallComing(false);
		})

		

		return () => {
			socketRef.current?.off('recieve-request-song');
			socketRef.current?.off('user-disconnet');
			socketRef.current?.off('receive-message');
			// socketRef.current?.off('play-ending-tone');
			// socketRef.current?.off('play-welcome-tone');
		}
	}, [socketRef.current]);




	useEffect(() => {
		socketListnerRef.current = socketInit();
		let userTemp = JSON.parse(JSON.stringify(user));
		console.log(userTemp?._id,"roomiddddddddddd")
		socketListnerRef.current.emit('user-join', { roomId: userTemp?._id },(data) => {
			console.log("User joined!",data,userTemp.name);
			if(data == userTemp.name){
				setActive(true);
			}
		});


		socketListnerRef.current?.on('play-ending-tone', (data) => {
			console.log("Ending Tone called!");
			handlePlayEnd();
		});

		socketListnerRef.current?.on('play-welcome-tone', (data) => {
			console.log("Welcome Tone called!");
			handlePlayWelcome();
		});


		socketListnerRef.current?.on('welcome-tone-played', (data) => {
			console.log("Welcome Tone played!");
			handleWelcomeTonePlayed();
		});

		socketListnerRef.current?.on('ending-tone-played', (data) => {
			console.log("Ending Tone played!");
			handleEndTonePlayed();
		});
		socketListnerRef.current?.on('active-dj-name', (data) => {
			console.log("Active DJ Name:", data);
		});

		return () => {
			socketListnerRef.current?.off('play-ending-tone');
			socketListnerRef.current?.off('play-welcome-tone');
			socketListnerRef.current?.off('active-dj-name');
		}
	},[user])


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
	}, [])

	const handleShare = async (id=null) => {
		const url = `${window.location.origin}/public/${id ? id : user?._id}`;
		await navigator.clipboard.writeText(url);
	}


	// function AudioProcess() {
	// 	if (!micOnRef.current) {
	// 		setVoiceComing(false);
	// 		return
	// 	}
	// 	const array = new Uint8Array(analyserRef.current.frequencyBinCount);
	// 	analyserRef.current.getByteFrequencyData(array);
	// 	const arraySum = array.reduce((a, value) => a + value, 0);
	// 	const average = arraySum / array.length;
	// 	// console.info('voulme',Math.round(average));
	// 	// colorPids(average);
	// 	const voiceVolume = Math.round(average);
	// 	if (voiceVolume > 20) {
	// 		setVoiceComing(true);
	// 	} else {
	// 		setVoiceComing(false);
	// 	}
	// };


	// let volumeHistory = [];
	// const historyLength = 5;
	// let debounceTimeout = null;

	// function AudioProcess() {
	// 	if (!micOnRef.current) {
	// 		setVoiceComing(false);
	// 		return;
	// 	}

	// 	try {
	// 		const array = new Uint8Array(analyserRef.current.frequencyBinCount);
	// 		analyserRef.current.getByteFrequencyData(array);

	// 		const arraySum = array.reduce((a, value) => a + value, 0);
	// 		const average = arraySum / array.length;
	// 		const voiceVolume = Math.round(average);

	// 		// Smoothing
	// 		// volumeHistory.push(voiceVolume);
	// 		// if (volumeHistory.length > historyLength) {
	// 		// 	volumeHistory.shift();
	// 		// }
	// 		// const smoothedVolume = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length;

	// 		// Debouncing
	// 		if (debounceTimeout === null) {
	// 			debounceTimeout = setTimeout(() => {
	// 				if (voiceVolume > 20) {
	// 					setVoiceComing(true);
	// 				} else {
	// 					setVoiceComing(false);
	// 				}
	// 				debounceTimeout = null;
	// 			}, 100);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error processing audio data:', error);
	// 	}
	// }





	const ownerJoin = async (id = null) => {
		console.log('join')
		// Join LiveKit now, not on page load (see LiveProvider). If this fails
		// the show must not start: the socket would tell listeners we're live
		// while nothing is published (dead air, Oct 21 2026).
		const connected = await connectForLive();
		if (!connected) {
			console.error('Go Live aborted: LiveKit not connected');
			return false;
		}
		socketRef.current = socketInit();
		// socketRef.current.on('offer', handleOffer);
		let userTemp = JSON.parse(JSON.stringify(user));
		if(id){
			userTemp._id = id;
		}

		socketRef.current.emit('owner-join', { user: userTemp });
		// The backend only knows a DJ is live through owner-join, and it forgets
		// on every socket drop (phone network, nginx reload, backend restart).
		// Re-announce on every reconnect while the show is on, or listeners are
		// sent back to Auto DJ while the DJ is still publishing to LiveKit.
		let firstConnectSeen = false;
		socketRef.current.on('connect', () => {
			// The initial owner-join above is already queued for the first connect.
			if (!firstConnectSeen) { firstConnectSeen = true; return; }
			if (showLiveRef.current) {
				socketRef.current.emit('owner-join', { user: userTemp });
			}
		});
		// Backend reconciler: it compared its state with LiveKit and found no
		// track from us. Tell the DJ instead of letting them talk to nobody.
		socketRef.current.on('reconcile-not-publishing', (data) => {
			setBackendNotice(`The server sees no audio from you (${data?.reason || 'no track'}). Press End, then Go Live again.`);
		});
		setBackendNotice('');
		const { stream, error: micError } = await requestMic();
		showLiveRef.current = true;
		if (!stream) {
			// The show goes on without a microphone (songs still reach listeners);
			// the DJ is told exactly why and can press the mic button once it is allowed.
			setMicOn(false);
			micOnRef.current = false;
			setMicNotice(micError);
			toast.error(micError, { autoClose: 12000 });
		} else {
			attachMic(stream);
		}

		//deteting the audio
		// const analyser = audioContext.createAnalyser();
		// const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
		// analyser.smoothingTimeConstant = 0.8;
		// analyser.fftSize = 1024;
		// analyserRef.current = analyser;
		// scriptProcessorRef.current = scriptProcessor;

		// mic.connect(analyser);
		// analyser.connect(scriptProcessor);
		// scriptProcessor.connect(audioContext.destination);
		// scriptProcessorRef.current.addEventListener('audioprocess', AudioProcess);
		return true;
	}

	const ownerLeft = async () => {

		socketRef.current?.disconnect();
		setMicOn(false);
		micOnRef.current = false;
		showLiveRef.current = false;
		localStreamRef.current?.getTracks().forEach(track => track.enabled = false);

		// Stop voice detection and release the ducking, or the next show
		// starts with a stale "speaking" state and a second hark instance.
		try { speechEventsRef.current?.stop(); } catch (e) { /* already stopped */ }
		speechEventsRef.current = null;
		if (duckReleaseTimerRef.current) {
			clearTimeout(duckReleaseTimerRef.current);
			duckReleaseTimerRef.current = null;
		}
		voiceSpeakingRef.current = false;
		micStreamRef.current?.getTracks().forEach(track => track.stop());



		const listeners = Object.keys(peersRef.current).length;

		// Object.keys(peersRef.current).forEach((peerId) => {
		// 	peersRef.current[peerId]?.close();
		// 	delete peersRef.current[peerId];
		// });

		//unpublish song, filter and mic
		const publications = Array.from(
			roomRef.current.localParticipant.trackPublications.values()
		);
		publications.forEach(publication => {
			console.log('publication', publication)
			roomRef.current.localParticipant.unpublishTrack(publication.track);
		});
		// Leave the room so this tab no longer holds the 'admin' identity.
		disconnectLiveKit();

		stopLevelMeter(false);
		stopLevelMeter(true);
		songOutputRef.current = null;
		filterOutputRef.current = null;
		songNodesRef.current = null;
		filterNodesRef.current = null;
		songTracksPublishedRef.current = false;
		filterTrackPublishedRef.current = false;
		if (micAudioContextRef.current && micAudioContextRef.current.state !== 'closed') {
			try { micAudioContextRef.current.close(); } catch (e) { /* ignore */ }
			micAudioContextRef.current = null;
		}

		// Clean up master AudioContext when leaving
		if (masterAudioContextRef.current && masterAudioContextRef.current.state !== 'closed') {
			try {
				masterAudioContextRef.current.close();
				masterAudioContextRef.current = null;
				console.log('🧹 Master AudioContext closed');
			} catch (e) { /* ignore */ }
		}

		// Clean up Object URLs
		if (songObjectUrlRef.current) {
			URL.revokeObjectURL(songObjectUrlRef.current);
			songObjectUrlRef.current = null;
		}
		if (filterObjectUrlRef.current) {
			URL.revokeObjectURL(filterObjectUrlRef.current);
			filterObjectUrlRef.current = null;
		}

		// Stop any playing audio
		if (songSourceRef.current?.pause) {
			songSourceRef.current.pause();
			songSourceRef.current.src = '';
		}
		if (filterSourceRef.current?.pause) {
			filterSourceRef.current.pause();
			filterSourceRef.current.src = '';
		}

		try {
			const { data } = await axios.post('/api/v1/listeners', { listeners });
			console.log(data);
		} catch (err) {
			console.log(err.message);
		}
	}

	function handleSendMessage() {
		// `message` did not exist in this scope (the prop is chatMessage): Send threw a ReferenceError.
		if (chatMessage && String(chatMessage).trim()) {
			socketRef.current?.emit('send-message', { message: chatMessage, roomId: user?._id.toString(), name: user?.name || 'owner', isOwner: true });
			setChatMessage('');
		}
	}

	function handleCallComing(response) {
		socketRef.current?.emit('call-response', { response, callerId });
		setcallComing(false);
		if (response) {
			callerDetailsRef.current[callerId] = {
				name: callerName.split('|')[0],
				location: callerName.split('|')[1],
				callerId
			}
		}
		setCallerId('');
		setCallerName('');
	}

	async function handleCallCut(id) {
		socketRef.current?.emit('admin-call-cut', { callerId: id });
		delete callerDetailsRef.current[id];
		delete callerStreamsRef.current[id];

		addStreamInMain(id);
		setCallDataChange(prev => !prev);
	}




	return { socketRef, ownerJoin, ownerLeft, micOn, micNotice, backendNotice, playSong, pauseSong, changeValume, SwitchOn, handleShare, requests, peersRef: newUser, sduration, remaining, progress, handleProgressChange, setProgress, playFilter, pauseFilter, changeFilterValume, fprogress, fremaining, fduration, changeMicValume, voiceComing, filterStreamloading, songStreamloading, recordMediaRef: mediaRecorderRef, recordReady, continuePlay, setContinuePlay, repeatPlaylist, setRepeatPlaylist, handleSendMessage, messageList, songBase, filterBase, callComing, callerName, handleCallComing, callsElementRef, callerDetailsRef, handleCallCut, callDataChange, resumeSong, autoAdjust, setAutoAdjust }
}

export default useSocket;