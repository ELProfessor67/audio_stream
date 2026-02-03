import useSocket from './useSocket';
import useSocketUser from './useSocketUser';
import useSocketTest from './useSocketTest';

export {useSocket,useSocketUser,useSocketTest}


// function getSongStream(songUrl,gainNodeRef,songSourceRef,volume,audioContextRef,progressCallback) {
// 	    return fetch(songUrl)
// 	        .then(response => response.arrayBuffer())
// 	        .then(arrayBuffer => {
// 	          return new Promise((resolve, reject) => {
// 	            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
// 	            audioContext.decodeAudioData(arrayBuffer, buffer => {
// 	            const source = audioContext.createBufferSource();
// 	            source.buffer = buffer;
	              
// 	            const gainNode = audioContext.createGain();

// 	                // Connect the source to the gain node
// 	            source.connect(gainNode);

// 	                // Connect the gain node to the audio context destination
// 	            gainNode.connect(audioContext.destination);

// 	                // Set the gain value to 0 (mute)
// 	            gainNode.gain.value = volume;
// 	            gainNodeRef.current = gainNode

// 	                // Start the playback
// 	            songSourceRef.current = source;

// 	            audioContextRef.current = audioContext;
// 	            const startTime = audioContext.currentTime;
// 	            setsduration(Math.floor(source.buffer.duration));
// 	            console.info('startTime',startTime)
// 	            const updateProgess = () => {
// 	            	const currentTime = audioContext.currentTime;
// 	            	const duration = source.buffer.duration;
// 	            	const progress = {
// 	            		currentTime,
// 	            		duration,
// 	            		percentage: (currentTime/duration) * 100,
// 	            		remainTime: duration - currentTime,
// 	            	}
// 	            	progressCallback(progress);
// 	            	// console.log('songPlaying',songPlayRef.current);
// 	            	if(currentTime < duration && songPlayRef.current){
// 	            		requestAnimationFrame(updateProgess);
// 	            	}

// 	            }


// 	            source.start();
// 	            updateProgess();

// 	            const songStream = audioContext.createMediaStreamDestination();
// 	            source.connect(songStream);

// 	            resolve(songStream.stream);
// 	            }, reject);
// 	          });
// 	        })
// 	        .then(songStream => {
// 	          console.log(songStream);
// 	          return songStream;
// 	        })
// 	        .catch(error => console.error('Error loading song:', error));
// 	}