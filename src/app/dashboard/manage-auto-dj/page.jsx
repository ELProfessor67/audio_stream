"use client";

import { useState, useEffect, useCallback } from 'react';
import axios, { getAdapter } from 'axios';
import Image from 'next/image';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';
import Link from 'next/link';
import { MdDelete } from 'react-icons/md'
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { useDispatch, useSelector } from 'react-redux';
import { GiLoveSong } from 'react-icons/gi';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';


function RenderPlayList({ playlist }) {
    const [open, setOpen] = useState(false);
    const handlePlaylistDragStart = (e) => {
        e.dataTransfer.setData("id", playlist._id)
        e.dataTransfer.setData("type", "playlist")
    }
    const handleSongDragStart = (e, song) => {
        e.dataTransfer.setData("data", JSON.stringify(song));
        e.dataTransfer.setData("type", "song");
    }



    return (
        <div >
            <p onClick={() => setOpen(prev => !prev)} className='text-black/90 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2' draggable onDragStart={handlePlaylistDragStart}>
                <img src={playlist.cover} width={20} height={20} className='rounded-md' />
                {playlist.title}
            </p>
            {open &&
                <div className='flex flex-col gap-2 pl-5' >
                    {
                        playlist?.songs?.map((song) => (
                            <p className='text-black/80 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2' draggable onDragStart={(e) => handleSongDragStart(e, song)}>
                                <span className='text-blue-300'>{<GiLoveSong />}</span>
                                {song.title}
                            </p>
                        ))
                    }
                </div>
            }
        </div>
    )
}

export default function Page() {
    const [playlists, setPlaylists] = useState([]);
    const [autoDJList, setAutoDjList] = useState([]);
    const { user } = useSelector(store => store.user);

    const getPlaylist = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/playlist');
            setPlaylists(data?.playlists);
        } catch (error) {
            console.log(`Error while gettting playlist`, error.message)
        }
    }, []);


    const getAutoDjlist = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/auto-dj-list');
            const items = data?.autoDJList.songs.map((song) => ({
                data:song.data,
                index: song.index,
                cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`
            })) || []
            setAutoDjList(items);
        } catch (error) {
            console.log(`Error while gettting autoDJlist`, error.message)
        }
    }, []);

    const updateSong = useCallback(async (songs) => {
        try {
            const res = await axios.post('/api/v1/auto-dj-list', { songs });
        } catch (error) {
            console.log('Getting Error While Doing Update', error.message);
        }
    })

    useEffect(() => {
        getPlaylist();
        getAutoDjlist();
    }, []);


    const handleDrop = async (e) => {
        try {
            const type = e.dataTransfer.getData('type');
            if (type == 'playlist') {
                const id = e.dataTransfer.getData('id');
                return
            } else {
                const data = e.dataTransfer.getData('data');
                const song = JSON.parse(data);
                const newSong = {
                    data: song,
                    cover: song.cover,
                    index: autoDJList.length
                }

                const songs = [...autoDJList, newSong]
                setAutoDjList(songs);
                const items = songs.map((song, index) => ({
                    data: song.data._id,
                    cover: new URL(song.cover).pathname,
                    index
                }));
                updateSong(items);
            }
        } catch (error) {
            console.log(`Getting Error During Drop`, error.message)
        }
    }


    function handleOnDragEnd(result) {
        if (!result.destination) return;

        let items = Array.from(autoDJList);
        let [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        items = items.map((song, index) => {
            song.index = index;
            return song;
        });
        setAutoDjList(items);

        items = items.map((song, index) => ({
            data: song.data._id,
            cover: new URL(song.cover).pathname,
            index
        }))
        updateSong(items);

    }


    const handleDelete = async (index) => {
        try {
            let items = autoDJList.filter((s,i) => i != index);
            setAutoDjList(items);

            items = items.map((song, index) => ({
                data: song.data._id,
                cover: new URL(song.cover).pathname,
                index
            }))

            updateSong(items);
        } catch (error) {
            console.log('Getting Error During Delete',error.message)
        }
    }
    return (
        <>
            <section className="w-full py-5 px-4 reletive">
                <div className="flex justify-center items-center">
                    <h1 className='main-heading my-10'>Manage Auto DJ</h1>
                </div>

                <div className='grid grid-cols-[2fr_1fr] relative h-[80vh]' >
                    <div className='p-2' onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <Droppable droppableId="characters">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        {
                                            autoDJList && autoDJList?.map((data, index) => (
                                                <Draggable key={data.data._id.toString()} draggableId={data.data._id.toString()} index={index}>
                                                    {(provided) => (
                                                        <div className={`flex justify-between items-center my-6 rounded-md`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-black text-2xl">{data.index + 1}</span>
                                                                <Image src={data.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
                                                                <div>
                                                                    <h2 className="text-xl text-black">{data?.data.title?.slice(0, 40)}</h2>
                                                                    <p className="para"> ~ {data?.data.artist} - {data.data?.album}</p>

                                                                </div>
                                                            </div>
                                                            <div>
                                                                <button className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 mr-4"><MdDelete size={20} onClick={() => handleDelete(index)}/></button>
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
                    <div className='p-2 bg-gray-100' >
                        {
                            playlists.length != 0 && playlists?.map((data) => (
                                <RenderPlayList playlist={data} />
                            ))
                        }
                    </div>
                </div>
            </section>
        </>
    );
}