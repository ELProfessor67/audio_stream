"use client";

import { useState } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { GiLoveSong } from 'react-icons/gi';

// Artwork arrives at whatever resolution it was uploaded at, so every thumbnail
// is locked to a square box and cropped rather than stretched.
export function CoverThumb({ src, size = 22, alt = '', className = '' }) {
    const [broken, setBroken] = useState(false);
    const box = { width: size, height: size, minWidth: size, minHeight: size };

    if (!src || broken) {
        return (
            <span
                style={box}
                className={`inline-flex items-center justify-center rounded-md bg-indigo-100 text-indigo-400 ${className}`}
            >
                <FaFolder size={size * 0.55} />
            </span>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            style={box}
            onError={() => setBroken(true)}
            className={`rounded-md object-cover bg-gray-100 ${className}`}
        />
    );
}

const rowBase = 'text-black/90 rounded-md hover:bg-gray-100 transition-all p-1 px-2 cursor-pointer flex items-center gap-2';

function SongRow({ song, playlistId, folderId, onSongDragStart, handleContextMenu }) {
    return (
        <p
            className={`${rowBase} text-black/80`}
            draggable
            onDragStart={(e) => {
                e.stopPropagation();
                onSongDragStart(e, song, playlistId, folderId);
            }}
            onContextMenu={(e) => handleContextMenu(e, {
                type: 'song',
                _id: song._id,
                playlistId,
                folderId,
                title: song.title,
            })}
        >
            <span className='text-blue-300'><GiLoveSong /></span>
            <span className='truncate'>{song.title}</span>
        </p>
    );
}

function FolderRow({ playlist, folder, songs, onSongDragStart, onSongDrop, handleContextMenu }) {
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState(false);

    const handleDragStart = (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('isFolder', 'true');
        e.dataTransfer.setData('playlistId', playlist._id);
        e.dataTransfer.setData('folderId', folder._id);
        e.dataTransfer.setData('songs', JSON.stringify(songs));
    };

    const handleDrop = (e) => {
        e.stopPropagation();
        setHover(false);
        onSongDrop(e, playlist._id, folder._id);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={handleDrop}
            className={hover ? 'rounded-md ring-2 ring-indigo-400' : ''}
        >
            <p
                onClick={() => setOpen((prev) => !prev)}
                className={rowBase}
                draggable
                onDragStart={handleDragStart}
                onContextMenu={(e) => handleContextMenu(e, {
                    type: 'folder',
                    _id: folder._id,
                    playlistId: playlist._id,
                    name: folder.name,
                    cover: folder.cover,
                    songs: folder.songs,
                })}
            >
                <span className='text-yellow-500'>{open ? <FaFolderOpen /> : <FaFolder />}</span>
                <CoverThumb src={folder.cover} size={20} alt={folder.name} />
                <span className='truncate'>{folder.name}</span>
                <span className='text-xs text-gray-400'>({songs.length})</span>
            </p>

            {open && (
                <div className='flex flex-col gap-2 pl-6'>
                    {songs.length === 0
                        ? <p className='text-xs text-gray-400 px-2 py-1'>Drop songs here</p>
                        : songs.map((song) => (
                            <SongRow
                                key={`${folder._id}-${song._id}`}
                                song={song}
                                playlistId={playlist._id}
                                folderId={folder._id}
                                onSongDragStart={onSongDragStart}
                                handleContextMenu={handleContextMenu}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}

export default function PlaylistTree({ playlist, onSongDragStart, onSongDrop, handleContextMenu }) {
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState(false);

    const allSongs = playlist?.songs || [];
    const folders = playlist?.folders || [];

    const songById = new Map(allSongs.map((song) => [String(song._id), song]));
    const grouped = new Set();
    folders.forEach((folder) => (folder.songs || []).forEach((id) => grouped.add(String(id))));

    // Folder membership is stored as ids; resolve them against the playlist's
    // own tracks so a stale id simply drops out instead of rendering blank.
    const songsOf = (folder) => (folder.songs || [])
        .map((id) => songById.get(String(id)))
        .filter(Boolean);

    const looseSongs = allSongs.filter((song) => !grouped.has(String(song._id)));

    const handleDragStart = (e) => {
        e.dataTransfer.setData('id', playlist._id);
        e.dataTransfer.setData('isPlaylist', 'true');
    };

    const handleDrop = (e) => {
        setHover(false);
        onSongDrop(e, playlist._id, null);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setHover(true); }}
            onDragLeave={() => setHover(false)}
            onDrop={handleDrop}
            className={hover ? 'rounded-md ring-2 ring-indigo-500' : ''}
        >
            <p
                onClick={() => setOpen((prev) => !prev)}
                className={rowBase}
                draggable
                onDragStart={handleDragStart}
                onContextMenu={(e) => handleContextMenu(e, {
                    type: 'playlist',
                    _id: playlist._id,
                    title: playlist.title,
                    album: playlist.album,
                    artist: playlist.artist,
                })}
            >
                <CoverThumb src={playlist.cover} size={22} alt={playlist.title} />
                <span className='truncate'>{playlist.title}</span>
            </p>

            {open && (
                <div className='flex flex-col gap-2 pl-5'>
                    {folders.map((folder) => (
                        <FolderRow
                            key={folder._id}
                            playlist={playlist}
                            folder={folder}
                            songs={songsOf(folder)}
                            onSongDragStart={onSongDragStart}
                            onSongDrop={onSongDrop}
                            handleContextMenu={handleContextMenu}
                        />
                    ))}

                    {looseSongs.map((song) => (
                        <SongRow
                            key={song._id}
                            song={song}
                            playlistId={playlist._id}
                            folderId={null}
                            onSongDragStart={onSongDragStart}
                            handleContextMenu={handleContextMenu}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
