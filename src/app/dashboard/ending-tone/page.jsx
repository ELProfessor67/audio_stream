"use client";
import { MdDelete, MdEdit } from 'react-icons/md'
import axios from 'axios'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch, useSelector } from 'react-redux';
import SongCard from '@/components/SongCard';
import { loadme } from '@/redux/action/user';

export default function page() {
    const [fileLoad, setFileLoad] = useState(0);
    const [playSong, setPlaySong] = useState(false);
    const fileRef = useRef(null);
    const songRef = useRef();
    const { user } = useSelector(store => store.user);
    const dispatch = useDispatch();


    useEffect(() => {
        if (playSong) {
            songRef.current.src = playSong;
            songRef.current.play();

        } else {
            console.log('pause', playSong, songRef)
            songRef.current.pause();
        }
    }, [playSong]);


    const handleUpload = async (e) => {
        const [file] = e.target.files;

        const reader = new FileReader();

        reader.onload = function () {
            if (reader.readyState == 2) {
                const base64String = reader.result;
                const extention = file.name.split('.').reverse()[0]

                const audio = new Audio(base64String);
                audio.addEventListener('loadedmetadata', async function () {
                    // console.log('duration',audio.duration);
                    try {
                        const { data } = await axios.post('/api/v1/ending-tone', { audioEx: extention, audio: base64String }, {
                            onUploadProgress: (ProgressEvent) => {
                                const progress = Math.round((ProgressEvent.loaded * 100) / ProgressEvent.total);
                                setFileLoad(progress);
                            }
                        });
                        
                        dispatch(loadme());
                        await dispatch(showMessage(data.message));
                        await dispatch(clearMessage());
                        setFileLoad(0);
                    } catch (error) {
                        await dispatch(showError(error.response.data.message));
                        await dispatch(clearError());
                        setFileLoad(0);
                    }
                })
            }
        }

        reader.readAsDataURL(file);
    }


    return (
        <section className="w-full py-5 px-4 reletive">
            <input type='file' className='hidden' ref={fileRef} onChange={handleUpload} />
            <div className="flex justify-center items-center">
                <h1 className='main-heading mt-10'>Ending Tone</h1>
            </div>
            <div className="flex justify-end items-center mb-5">
                <button onClick={() => fileRef.current.click()} className="py-2 px-4 rounded-md bg-indigo-500 text-white">{fileLoad !== 0 ? `${fileLoad}%` : user?.endingTone ? 'Change Tone' : 'Add Tone'}</button>
            </div>


            <div className='flex justify-center items-center w-full h-[30rem]'>
                {
                    user?.endingTone
                        ? (
                            <SongCard title={'Welcome Tone'} artist={user?.name} cover={`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload/cover/default.jpg`} playSong={playSong} setPlaySong={setPlaySong} audio={`${process.env.NEXT_PUBLIC_SOCKET_URL}${user?.endingTone}`} />
                        )
                        : (
                            <h2 className='text-xl'>No Ending Tone set.</h2>
                        )
                }
            </div>
            <audio ref={songRef} className="hidden"></audio>
        </section>
    )
}
