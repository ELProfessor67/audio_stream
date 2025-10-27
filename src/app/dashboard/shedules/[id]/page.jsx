"use client";
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { MdAlternateEmail, MdAudiotrack, MdKey, MdDateRange, MdPlaylistAdd, MdDelete } from 'react-icons/md'
import Link from 'next/link'
import { MdOutlineSubtitles, MdDescription, MdPhoto } from 'react-icons/md';
import { IoMdTime } from 'react-icons/io';
import { FaUserAlt } from 'react-icons/fa';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { BsEye } from 'react-icons/bs';

const days = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
};


const page = ({ params }) => {
    const [selectedDay, setSelectedDay] = useState('0');
    const [open, setOpen] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlatlist] = useState([]);
    const [selectedSong, setSelectedSong] = useState([]);
    const [songOpen, setSongOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewSongs, setViewSongs] = useState(false);
    const [mappedSongs, setMappedSongs] = useState({});
    const dispatch = useDispatch();
    const { user } = useSelector(store => store.user);

    const handleCheckbox = (id, data) => {
        setMappedSongs(prev => ({
            ...prev,
            [id]: data
        }));
        setSelectedSong(prev => {
            if (prev.includes(id)) {
                return prev.filter(_id => _id != id);
            } else {
                return [...prev, id]
            }
        })
    }

    const handlePlaylist = (data) => {
        setSelectedPlatlist(data?.songs);
        setSongOpen(true);
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // console.log(date,time,selectedSong,ads);
            if (selectedSong.length === 0) {
                return alert('plase select at least 1 song');
            }
            const { data } = await axios.put(`/api/v1/schedule/${params.id}`, { day: selectedDay, songs: selectedSong });
            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
        } catch (error) {
            await dispatch(showError(error.response.data.message));
            await dispatch(clearError());
        }
        setLoading(false);

    }

    useEffect(() => {
        (
            async function () {
                try {
                    const { data } = await axios.get('/api/v1/playlist');
                    const filter = data?.playlists.filter(playlist => playlist.title !== 'Ads');
                    setPlaylists(filter);
                } catch (err) {
                    console.log(err?.response?.data?.message);
                }
            }
        )()
    }, []);

    useEffect(() => {
        (async function () {
            try {
                const { data } = await axios.get(`/api/v1/schedule/${params.id}`);
                if (data.schedule) {
                    setSelectedDay(data.schedule.day);
                    setSelectedSong(data.schedule.songs);
                }
                setPlaylists(filter);
            } catch (err) {
                console.log(err?.response?.data?.message);
            }
        })()
    }, [])


    const getSongInPlaylist = (id,playlists) => {
        for(let playlist of playlists){
            for(let song of playlist.songs){
                if(song._id === id){
                    return song;
                }
            }
        }
        return null;
    }


    useEffect(() => {
       if(selectedSong.length > 0 && playlists.length > 0){
        selectedSong.forEach(_id => {
            const song = getSongInPlaylist(_id,playlists);
            setMappedSongs(prev => ({
                ...prev,
                [_id]: song
            }));
                        
        })
       }
    },[selectedSong,playlists])


    const handleSelectAll = () => {
        const allIds = selectedPlaylist.map((song) => song._id);
        const ids = allIds.filter(id => !selectedSong.includes(id));
        setSelectedSong(prev => [...prev, ...ids]);
    }

    const handlebottomSave = () => {
        toast.success("save successfully");
    }


    function handleOnDragEnd(result) {
        if (!result.destination) return;

        let items = Array.from(selectedSong);
        let [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSelectedSong(items);
    }


    const handleDelete = async (index) => {
        try {
            let items = selectedSong.filter((s, i) => i != index);
            setSelectedSong(items);
        } catch (error) {
            console.log('Getting Error During Delete', error.message)
        }
    }

    return (
        <section className='w-full py-5 px-4'>
            <div className='flex justify-start items-center h-full flex-col'>
                <h1 className='main-heading mb-10'>Update Song Schedule</h1>
                <div className='w-[40rem] max-w-[40rem] border border-x-gray-100 shadow-md p-3 rounded-md mb-6'>
                    <form className='p-3 px-6' onSubmit={handleSubmit}>


                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="time" className='text-black text-lg'>Select Date</label>
                            <div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                <IoMdTime size={20} className='text-gray-400' />
                                <select className='w-full outline-none border-none' value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                                    {
                                        user?.djDays?.map(day => (
                                            <option value={day}>{days[day]}</option>
                                        ))

                                    }
                                </select>
                            </div>
                        </div>

                        <div className='input-group flex flex-col gap-1 mb-6'>
                            <label for="description" className='text-black text-lg'>Select Songs</label>
                            <div className='flex items-center gap-2'>
                                <div className='flex flex-1 items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
                                    <MdPlaylistAdd size={20} className='text-gray-400' />
                                    <button type="button" className="w-full h-full text-gray-400 text-left bg-none border-none outline-none px-1" onClick={() => setOpen(true)}>
                                        {selectedSong.length === 0 ? "Select Song" : `${selectedSong.length} song seleted`}
                                    </button>
                                </div>

                                <button title='View Songs' type='button' className='bg-none outline-none border-none'>
                                    <BsEye size={20} className='text-blue-400 cursor-pointer' onClick={() => setViewSongs(true)} title='View Songs' />
                                </button>
                            </div>
                        </div>



                        <div className='flex justify-center items-center'>
                            <button type='submit' className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all'>{!loading ? 'Update' : 'Loading...'}</button>
                        </div>
                    </form>
                </div>
            </div>

            <Dialog open={open} onClose={() => setOpen(false)} heading={'Select Playlist'}>
                {playlists.map(data => (
                    <div className="flex justify-between items-center my-2 py-1 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <Image src={data?.songs[0].cover} width={200} height={200} alt="cover" className="w-[5rem] h-[5rem] rounded-md" />
                            <div className="">
                                <h2 className="text-black text-xl font-semibold">{data?.title}</h2>
                                <p className="para">{data?.description}</p>
                            </div>
                        </div>

                        <div className="mr-10">
                            <button className="bg-none outline-none border-none text-black cursor-pointer" onClick={() => handlePlaylist(data)}><FaArrowUpRightFromSquare size={20} /></button>
                        </div>
                    </div>
                ))}
            </Dialog>


            <Dialog open={songOpen} onClose={() => setSongOpen(false)} seletdSongs={selectedSong} selectAll={handleSelectAll} bottomSave={handlebottomSave}>
                {
                    selectedPlaylist && selectedPlaylist.map((data) => (
                        <div className="flex justify-between items-center my-6">
                            <div className="flex items-center gap-4">
                                <Image src={data.cover} width={200} height={200} alt="cover" className="h-[6rem] w-28 object-conver rounded" />
                                <h2 className="text-xl text-black">{data?.title}</h2>
                            </div>

                            <div className="mr-10">
                                <input type="checkbox" className="p-4" checked={selectedSong.includes(data._id)} onChange={() => handleCheckbox(data._id, data)} />
                            </div>
                        </div>
                    ))
                }
            </Dialog>


            <Dialog open={viewSongs} onClose={() => setViewSongs(false)} heading={'View Songs'}>
                <div className='p-2'>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="characters">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {
                                        selectedSong && selectedSong?.map((_id, index) => (
                                            <Draggable key={mappedSongs[_id]?._id.toString()} draggableId={mappedSongs[_id]?._id.toString()} index={index}>
                                                {(provided) => (
                                                    <div className={`flex justify-between items-center my-6 rounded-md`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-black text-2xl">{index + 1}</span>
                                                            <Image src={mappedSongs[_id]?.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
                                                            <div>
                                                                <h2 className="text-xl text-black">{mappedSongs[_id]?.title?.slice(0, 40)}</h2>
                                                                <p className="para"> ~ {mappedSongs[_id]?.artist} - {mappedSongs[_id]?.album}</p>

                                                            </div>
                                                        </div>
                                                        <div>
                                                            <button className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 mr-4"><MdDelete size={20} onClick={() => handleDelete(index)} /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    }
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </Dialog>

        </section>
    )
}

export default page