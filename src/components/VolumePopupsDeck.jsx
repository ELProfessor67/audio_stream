import React, { useEffect, useRef, useState,memo } from 'react'


const highRange = [0.45,0.5];
const lowRange = [0,0.2];
const goodVolume = 0.4;

const VolumePopupsDeck = ({deckname,volume,handleMicVolumeChange}) => {
    const [volumename,setVolumeName] = useState('high');
    const [showPopup ,setShowPupop] = useState(false);
    const [count,setCount] = useState(10);
    const timeoutRef1 = useRef();
    const timeoutRef2 = useRef();
    const intervalRef = useRef();


    function showPopupHandler() {
        setShowPupop(true);
        console.log('settimeout call before');
        timeoutRef2.current = setTimeout(() => {
            setCount(10);
            console.log('settimeout call after');
            handleMicVolumeChange({
                target: {
                    value: goodVolume
                }
            });
            setShowPupop(false);
            clearInterval(intervalRef.current);
        },10000);


        intervalRef.current = setInterval(() => setCount(prev => prev-1),1000);
    }


    const handleCancel = () => {    
        clearTimeout(timeoutRef2.current);
        clearInterval(intervalRef.current);
        setCount(10);
        setShowPupop(false);
    }

    const handleOkay = () => {
        handleMicVolumeChange({
            target: {
                value: goodVolume
            }
        });
        clearTimeout(timeoutRef2.current);
        clearInterval(intervalRef.current);
        setCount(10);
        setShowPupop(false);
    }
    

    useEffect(() => {
        if(volume >= highRange[0] && volume <= highRange[1]){
            setVolumeName('high');
            timeoutRef1.current = setTimeout(showPopupHandler,3000);

        }else if(volume >= lowRange[0] && volume <= lowRange[1]){
            setVolumeName('low');
            timeoutRef1.current = setTimeout(showPopupHandler,3000);
        }else{
            setShowPupop(false);
            clearTimeout(timeoutRef2.current);
        }

        console.log('changing...',volume)

       
        return () => clearTimeout(timeoutRef1.current);
        
    },[volume])
  return (
    <div className={`w-[90%] p-4 rounded-md bg-white shadow-md mx-auto mt-4 absolute left-[5%]  items-center flex-col z-40 ${showPopup ? 'flex' : 'hidden'}`}>
        <span className='triangle'></span>
        <h2 className='text-2xl text-black/90 mb-4 text-center main-heading'>Volume Too {volumename}</h2>
        <p className='text-lg text-center para mt-5'>The sound from {deckname} is getting {volumename} on the radio station you want us to adjust for you?</p>

        <div className='flex items-center justify-between w-full px-2 mt-5'>
        <button onClick={handleCancel} className="bg-gray-200 disabled:opacity-50 outline-none border-none text-xl mt-5 py-2 px-4 rounded-md text-black/80" title="on click sound will be adjust automatically.">
			Cancel
		</button>
        <button onClick={handleOkay} className="bg-indigo-600 disabled:opacity-50 outline-none border-none text-xl mt-5 py-2 px-4 rounded-md text-white" title="on click sound will be adjust automatically.">
			OK ({count}s)
		</button>
        </div>
    </div>
  )
}

export default memo(VolumePopupsDeck)