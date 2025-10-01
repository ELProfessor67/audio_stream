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
            console.log("Adjusting...")
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


























// import React, { useEffect, useRef } from 'react';

// /**
//  * AutoAdjustByBase Component - Automatic Audio Leveling for Internet Radio
//  * 
//  * This component implements AGC (Automatic Gain Control) functionality similar to
//  * broadcast audio processors like Stereo Tool. It automatically adjusts playback
//  * volume based on the audio content's characteristics.
//  * 
//  * @param {Object} props - Component props
//  * @param {boolean} props.songPlaying - Whether a song is currently playing
//  * @param {number} props.songBase - Audio level measurement (0-100+ scale)
//  * @param {Function} props.handleVolumeChange - Callback to change the actual volume
//  * @param {boolean} props.userChangeVolume - Flag indicating if user manually changed volume
//  * @param {boolean} props.voiceActive - Whether voice/DJ is currently speaking (FIXED TYPO)
//  * @param {number} props.volume - Current volume level (0.0 to 1.0)
//  * @returns {null} - This is a logic-only component, renders nothing
//  */
// const AutoAdjustByBase = ({ 
//     songPlaying, 
//     songBase, 
//     handleVolumeChange, 
//     userChangeVolume, 
//     voiceActive, // FIXED: was "voiceAcitce" 
//     volume: currentVolume 
// }) => {
//     // REF: Stores the calculated volume to prevent unnecessary re-renders
//     // Using useRef instead of useState since we don't need to trigger re-renders
//     // when this value changes - it's purely for internal logic
//     const volume = useRef(0.25); // Start with a moderate 25% volume (industry standard midpoint)

//     /**
//      * MAIN EFFECT: Handles all volume adjustment scenarios
//      * Runs whenever any dependency changes (song state, base level, user interactions)
//      */
//     useEffect(() => {
        
//         // ============================================================================
//         // SCENARIO 1: VOICE DUCKING (Highest Priority)
//         // ============================================================================
//         // When DJ/announcer is speaking, automatically reduce music volume
//         // This is called "ducking" in broadcast audio processing
//         if (voiceActive && songPlaying) {
//             console.log("Voice ducking activated:", voiceActive);
            
//             // Only duck if music is currently audible
//             // Prevents unnecessary volume changes if music is already muted
//             if (currentVolume > 0) {
//                 handleVolumeChange(0.15); // Reduce to 15% for voice clarity
//                 // NOTE: 0.15 is aggressive ducking - consider 0.25-0.3 for subtler effect
//             }
//         } 
        
//         // ============================================================================
//         // SCENARIO 2: AUTOMATIC LEVELING (AGC Implementation)
//         // ============================================================================
//         // Apply automatic gain control when music is playing and user hasn't manually adjusted
//         else if (songPlaying && !userChangeVolume) {
//             console.log("AGC: Adjusting volume based on songBase:", songBase);
            
//             let adjustedVolume = volume.current; // Start with current ref value
            
//             // -----------------------------------------------------------------------
//             // VOLUME MAPPING ALGORITHM
//             // -----------------------------------------------------------------------
//             // Maps songBase (audio level measurement) to appropriate playback volume
//             // Lower songBase = quieter content = higher playback volume needed
//             // Higher songBase = louder content = lower playback volume needed
//             //
//             // NOTE: This algorithm may need tuning based on your songBase measurement method
//             // (RMS, peak, LUFS, frequency analysis, etc.)
            
//             // VERY QUIET CONTENT (0-5 range)
//             if (songBase < 5) {
//                 adjustedVolume = 0.5; // 50% - Maximum safe volume for very quiet content
//             } 
//             // QUIET CONTENT (5-10 range)
//             else if (songBase < 10) {
//                 adjustedVolume = 0.45; // 45% - High volume for quiet content
//             } 
//             // LOW-QUIET CONTENT (10-15 range)
//             else if (songBase < 15) {
//                 adjustedVolume = 0.4; // 40% - Moderately high volume
//             } 
//             // LOW CONTENT (15-20 range)
//             else if (songBase < 20) {
//                 adjustedVolume = 0.35; // 35% - Moderate volume
//             } 
//             // LOW-MID CONTENT (20-25 range)
//             else if (songBase < 25) {
//                 adjustedVolume = 0.3; // 30% - Slightly below normal
//             } 
//             // MID CONTENT (25-30 range)
//             else if (songBase < 30) {
//                 adjustedVolume = 0.25; // 25% - Normal/reference volume
//             } 
//             // MID-RANGE CONTENT (30-50 range)
//             else if (songBase < 50) {
//                 adjustedVolume = 0.25; // 25% - Maintain steady volume for broad mid-range
//             } 
//             // MID-HIGH CONTENT (50-60 range)
//             else if (songBase < 60) {
//                 adjustedVolume = 0.3; // 30% - POTENTIAL ISSUE: Why increase here?
//                 // This seems counterintuitive - higher base should = lower volume
//             } 
//             // HIGH CONTENT (60-70 range)
//             else if (songBase < 70) {
//                 adjustedVolume = 0.35; // 35% - POTENTIAL ISSUE: Still increasing
//             } 
//             // HIGH CONTENT (70-80 range)
//             else if (songBase < 80) {
//                 adjustedVolume = 0.4; // 40% - POTENTIAL ISSUE: Peak volume for high content?
//             } 
//             // VERY HIGH CONTENT (80-90 range)
//             else if (songBase < 90) {
//                 adjustedVolume = 0.25; // 25% - Sudden drop - inconsistent with curve above
//             } 
//             // EXTREMELY HIGH CONTENT (90+ range)
//             else if (songBase >= 90) {
//                 adjustedVolume = 0.1; // 10% - Minimum volume to prevent audio distortion/clipping
//             }

//             // ALTERNATIVE ALGORITHM (More Linear/Predictable):
//             // const normalizedBase = Math.max(0, Math.min(100, songBase)) / 100;
//             // adjustedVolume = 0.5 - (normalizedBase * 0.4); // Linear: 0.5 down to 0.1

//             // Store the calculated volume in ref for next iteration
//             volume.current = adjustedVolume;

//             // Apply the volume change through the provided callback
//             handleVolumeChange(adjustedVolume);
//         } 
        
//         // ============================================================================
//         // SCENARIO 3: USER CONTROL OVERRIDE
//         // ============================================================================
//         // When user manually adjusts volume, respect their choice and disable AGC
//         else if (userChangeVolume && songPlaying) {
//             console.log("User control: Applying manual volume:", currentVolume);
            
//             // Pass through the user's volume setting without modification
//             // This effectively disables AGC until userChangeVolume flag is reset
//             handleVolumeChange(currentVolume);
//         }
        
//         // ============================================================================
//         // IMPLICIT SCENARIO 4: Song Not Playing
//         // ============================================================================
//         // When songPlaying is false, none of the above conditions trigger
//         // Volume remains unchanged (appropriate behavior for paused/stopped state)
        
//     }, [
//         songPlaying,        // Re-run when play/pause state changes
//         songBase,          // Re-run when audio level measurement updates  
//         handleVolumeChange, // Re-run if volume handler changes (unlikely but good practice)
//         userChangeVolume,   // Re-run when user control flag changes
//         voiceActive,        // Re-run when voice state changes
//         currentVolume       // Re-run when current volume changes
//     ]);

//     // This component is purely functional - no UI rendering
//     // All audio processing happens through side effects
//     return null;
// };

// // ================================================================================
// // EXPORT & USAGE NOTES
// // ================================================================================
// // 
// // INTEGRATION TIPS:
// // 1. Place this component near your audio player in the component tree
// // 2. Ensure songBase updates in real-time during playback
// // 3. Consider debouncing songBase updates to prevent rapid volume changes
// // 4. Test with various audio content types (speech, music, different genres)
// //
// // POTENTIAL IMPROVEMENTS:
// // 1. Add smooth volume transitions instead of instant changes
// // 2. Implement compression ratios for different content types
// // 3. Add user preferences for AGC sensitivity
// // 4. Include peak limiting to prevent audio clipping
// // 5. Add loudness normalization targeting -16 LUFS (broadcast standard)
// //
// // DEBUGGING:
// // - Monitor console.log outputs to verify AGC behavior
// // - Track volume.current values to ensure proper calculations
// // - Test edge cases (very quiet content, sudden volume spikes, voice transitions)

// export default AutoAdjustByBase;