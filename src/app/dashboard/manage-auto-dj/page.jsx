"use client";

import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import axios from 'axios';
import Image from 'next/image';
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
        <div>
            <p onClick={() => setOpen(prev => !prev)} className='text-black/90 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2' draggable onDragStart={handlePlaylistDragStart}>
                <img src={playlist.cover} width={20} height={20} className='rounded-md' />
                {playlist.title}
            </p>
            {open &&
                <div className='flex flex-col gap-2 pl-5' >
                    {
                        playlist?.songs?.map((song) => (
                            <p key={song._id} className='text-black/80 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2' draggable onDragStart={(e) => handleSongDragStart(e, song)}>
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
    const [dropIndicatorIndex, setDropIndicatorIndex] = useState(null); // which position to show indicator
    const [isDragOver, setIsDragOver] = useState(false);
    const listRef = useRef(null);
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
                uiId: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
                data: song.data,
                index: song.index,
                cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`,
                album: song.album,
                artist: song.artist

            })) || []
            setAutoDjList(items);
        } catch (error) {
            console.log(`Error while gettting autoDJlist`, error.message)
        }
    }, []);

    const updateSong = useCallback(async (songs) => {
        try {
            await axios.post('/api/v1/auto-dj-list', { songs });
        } catch (error) {
            console.log('Getting Error While Doing Update', error.message);
        }
    })

    useEffect(() => {
        getPlaylist();
        getAutoDjlist();
    }, []);


    // Calculate which index to insert at, based on mouse Y position over the list
    const getDropIndex = useCallback((e) => {
        if (!listRef.current) return autoDJList.length;

        const listItems = listRef.current.querySelectorAll('[data-dj-item]');
        if (listItems.length === 0) return 0;

        for (let i = 0; i < listItems.length; i++) {
            const rect = listItems[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
                return i; // insert before this item
            }
        }
        return listItems.length; // insert at end
    }, [autoDJList.length]);


    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        // Only activate for external (playlist panel) drags
        const type = e.dataTransfer.types.includes('type') ? null : null; // we can't read data during dragover
        setIsDragOver(true);
        const idx = getDropIndex(e);
        setDropIndicatorIndex(idx);
    }, [getDropIndex]);

    const handleDragLeave = useCallback((e) => {
        // Only clear if leaving the container entirely
        if (!listRef.current?.contains(e.relatedTarget)) {
            setIsDragOver(false);
            setDropIndicatorIndex(null);
        }
    }, []);


    const handleDrop = async (e) => {
        setIsDragOver(false);
        setDropIndicatorIndex(null);
        console.log("helllooo", e)
        try {
            const type = e.dataTransfer.getData('type');
            if (type === 'playlist') {
                return;
            } else {
                const rawData = e.dataTransfer.getData('data');
                if (!rawData) return;
                const song = JSON.parse(rawData);

                // Figure out where to insert
                const insertAt = getDropIndex(e);

                const newSong = {
                    uiId: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
                    data: song,
                    cover: song.cover,
                    index: insertAt,
                    artist: song.artist,
                    album: song.album
                };

                // Insert at specific position
                const updated = [...autoDJList];
                updated.splice(insertAt, 0, newSong);

                // Re-index
                const reindexed = updated.map((s, i) => ({ ...s, index: i }));
                setAutoDjList(reindexed);

                const items = reindexed.map((s, i) => ({
                    data: s.data._id,
                    cover: new URL(s.cover).pathname,
                    index: i,
                    artist: s.artist,
                    album: s.album
                }));
                updateSong(items);
            }
        } catch (error) {
            console.log(`Getting Error During Drop`, error.message)
        }
    };


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
            index,
            artist: song.artist,
            album: song.album
        }))
        updateSong(items);
    }


    const handleDelete = async (index) => {
        try {
            let items = autoDJList.filter((s, i) => i != index);
            setAutoDjList(items);

            items = items.map((song, index) => ({
                data: song.data._id,
                cover: new URL(song.cover).pathname,
                index,
                artist: song.artist,
                album: song.album
            }))

            updateSong(items);
        } catch (error) {
            console.log('Getting Error During Delete', error.message)
        }
    }

    return (
        <>
            <section className="w-full py-5 px-4 reletive overflow-hidden">
                <div className="flex justify-center items-center">
                    <h1 className='main-heading my-10'>Manage Auto DJ</h1>
                </div>

                <div className='grid grid-cols-[2fr_1fr] relative h-[80vh]' >
                    {/* ---- AUTO DJ LIST (left panel) ---- */}
                    <div
                        className="p-2 relative h-[89vh] overflow-y-auto"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <Droppable droppableId="characters">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={(el) => { provided.innerRef(el); listRef.current = el; }}>

                                        {/* Empty-list hint */}
                                        {autoDJList.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                                                <GiLoveSong size={40} />
                                                <p className="text-sm">Drag songs here to build your Auto DJ list</p>
                                            </div>
                                        )}

                                        {autoDJList && autoDJList?.map((data, index) => (
                                            <Fragment key={data?.uiId}>
                                                {/* Animated space slot ABOVE this item */}
                                                <div
                                                    style={{
                                                        height: isDragOver && dropIndicatorIndex === index ? '72px' : '0px',
                                                        opacity: isDragOver && dropIndicatorIndex === index ? 1 : 0,
                                                        overflow: 'hidden',
                                                        transition: 'height 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                                                        marginBottom: isDragOver && dropIndicatorIndex === index ? '6px' : '0px',
                                                    }}
                                                >
                                                    <div style={{
                                                        height: '64px',
                                                        border: '2px dashed #93c5fd',
                                                        borderRadius: '8px',
                                                        background: 'rgba(219,234,254,0.45)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        color: '#3b82f6',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                    }}>
                                                        <GiLoveSong size={18} />
                                                        Drop here
                                                    </div>
                                                </div>

                                                <Draggable draggableId={data?.uiId} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            data-dj-item={index}
                                                            className={`flex justify-between items-center my-6 rounded-md`}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-black text-2xl">{data?.index + 1}</span>
                                                                <Image src={data?.cover} width={200} height={200} alt="cover" className="h-[3rem] w-[3rem] object-conver rounded" />
                                                                <div>
                                                                    <h2 className="text-xl text-black">{data?.data?.title?.slice(0, 40)}</h2>
                                                                    <p className="para"> ~ {data?.artist} - {data?.album}</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <button className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-400 mr-4"><MdDelete size={20} onClick={() => handleDelete(index)} /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            </Fragment>
                                        ))}

                                        {/* Animated space slot at END of list */}
                                        <div
                                            style={{
                                                height: isDragOver && dropIndicatorIndex === autoDJList.length ? '72px' : '0px',
                                                opacity: isDragOver && dropIndicatorIndex === autoDJList.length ? 1 : 0,
                                                overflow: 'hidden',
                                                transition: 'height 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                                                marginBottom: isDragOver && dropIndicatorIndex === autoDJList.length ? '6px' : '0px',
                                            }}
                                        >
                                            <div style={{
                                                height: '64px',
                                                border: '2px dashed #93c5fd',
                                                borderRadius: '8px',
                                                background: 'rgba(219,234,254,0.45)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                color: '#3b82f6',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}>
                                                <GiLoveSong size={18} />
                                                Drop here
                                            </div>
                                        </div>

                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* ---- PLAYLIST PANEL (right panel) ---- */}
                    <div className='p-2 bg-gray-100 h-[89vh] overflow-y-auto' >
                        {
                            playlists.length != 0 && playlists?.map((data) => (
                                <RenderPlayList key={data._id} playlist={data} />
                            ))
                        }
                    </div>
                </div>
            </section>
        </>
    );
}