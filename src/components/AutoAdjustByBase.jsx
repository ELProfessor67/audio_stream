import React, { useEffect, useRef } from 'react';

const AutoAdjustByBase = ({ songPlaying, songBase, handleVolumeChange,userChangeVolume, voiceAcitce,volume:currentVolume }) => {
    const volume = useRef(0.25); // Start with a midpoint volume

    useEffect(() => {
        if(voiceAcitce && songPlaying){
            console.log("voiceAcitce",voiceAcitce)
            if(currentVolume > 0){
                handleVolumeChange(0.15);
            }
        } else if (songPlaying && !userChangeVolume) {
            let adjustedVolume = volume.current;

            // // Normalize volume based on the song base level
            // if (songBase < 5) {
            //     adjustedVolume = 0.5; // Maximum volume for very low base
            // } else if (songBase < 10) {
            //     adjustedVolume = 0.45; // High volume for low base
            // } else if (songBase < 20) {
            //     adjustedVolume = 0.35; // Moderate volume for low base
            // } else if (songBase < 30) {
            //     adjustedVolume = 0.25; // Normal volume for moderate base
            // } else if (songBase > 80) {
            //     adjustedVolume = 0.1; // Minimum volume for very high base
            // } else if (songBase > 70) {
            //     adjustedVolume = 0.15; // Low volume for high base
            // } else if (songBase > 60) {
            //     adjustedVolume = 0.20; // Slightly low volume for high base
            // } else if (songBase > 50) {
            //     adjustedVolume = 0.25; // Normal volume for moderate high base
            // }

            if (songBase < 5) {
                adjustedVolume = 0.5; // Maximum volume for very low base
            } else if (songBase < 10) {
                adjustedVolume = 0.45; // High volume for low base
            } else if (songBase < 15) {
                adjustedVolume = 0.4; // Slightly lower for higher low base
            } else if (songBase < 20) {
                adjustedVolume = 0.35; // Moderate volume for low base
            } else if (songBase < 25) {
                adjustedVolume = 0.3; // Normal volume for mid-low base
            } else if (songBase < 30) {
                adjustedVolume = 0.25; // Normal volume for moderate base
            } else if (songBase < 50) {
                adjustedVolume = 0.25; // Steady volume for mid-range base
            } else if (songBase < 60) {
                adjustedVolume = 0.3; // Slightly increase volume for mid-high base
            } else if (songBase < 70) {
                adjustedVolume = 0.35; // Moderate volume for mid-high base
            } else if (songBase < 80) {
                adjustedVolume = 0.4; // Increase volume for high base
            } else if (songBase < 90) {
                adjustedVolume = 0.25; // Decrease volume to avoid overwhelming sound
            } else if (songBase >= 90) {
                adjustedVolume = 0.1; // Minimum volume for very high base
            }

            // Update the ref value
            volume.current = adjustedVolume;

            // Call handleVolumeChange with the adjusted volume
            handleVolumeChange(adjustedVolume);
        }else if(userChangeVolume && songPlaying){
            handleVolumeChange(currentVolume);
        }
    }, [songPlaying, songBase, handleVolumeChange,userChangeVolume]);

    return null;
};

export default AutoAdjustByBase;
