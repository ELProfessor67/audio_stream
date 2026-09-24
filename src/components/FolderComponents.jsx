"use client";

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { MdImage, MdOutlineSubtitles } from 'react-icons/md';
import Dialog from './Dialog';
import { CoverThumb } from './PlaylistTree';
import { showMessage, showError, clearMessage, clearError } from '@/utils/showAlert';
import { fileToSquareCover, COVER_SIZE } from '@/utils/coverImage';

// Creates or edits a folder inside a playlist. Tracks picked here are added to
// the parent playlist as well, since a folder only groups what the playlist has.
const FolderComponents = ({ open, setOpen, playlistId, folder, allsongs, getPlaylist }) => {
    const isEdit = Boolean(folder?._id);

    const [name, setName] = useState('');
    const [photo, setPhoto] = useState(null);
    const [coverEx, setCoverEx] = useState(null);
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!open) return;
        setName(folder?.name || '');
        setSelectedSongs((folder?.songs || []).map(String));
        setPhoto(null);
        setCoverEx(null);
        setSearch('');
    }, [open, folder?._id]);

    const handlePhotoChange = async (e) => {
        const [file] = e.target.files || [];
        if (!file) return;
        try {
            const { base64, ext } = await fileToSquareCover(file);
            setPhoto(base64);
            setCoverEx(ext);
        } catch (err) {
            await dispatch(showError(err.message));
            await dispatch(clearError());
        }
    };

    const handleCheckbox = (_id) => {
        const id = String(_id);
        setSelectedSongs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!name.trim()) return;
        if (!playlistId) return;

        setLoading(true);
        try {
            const body = { name: name.trim(), songs: selectedSongs };
            if (photo) {
                body.cover = photo;
                body.coverEx = coverEx;
            }

            const url = `/api/v1/playlist/${playlistId}/folder`;
            const { data } = isEdit
                ? await axios.put(url, { ...body, folderId: folder._id })
                : await axios.post(url, body);

            if (!data.success) throw new Error(data.message || 'could not save the folder');

            await dispatch(showMessage(data.message));
            await dispatch(clearMessage());
            setOpen(false);
            getPlaylist();
        } catch (err) {
            await dispatch(showError(err?.response?.data?.message || err.message));
            await dispatch(clearError());
        }
        setLoading(false);
    };

    const visibleSongs = (allsongs || []).filter((song) =>
        song?.title?.toLowerCase().includes(search.toLowerCase()));

    return (
        <Dialog open={open} onClose={() => setOpen(false)}>
            <div className='flex justify-start items-center h-full flex-col'>
                <h1 className='main-heading mb-6'>{isEdit ? 'Edit Folder' : 'Create Folder'}</h1>

                <form className='w-full px-6' onSubmit={handleSubmit}>
                    <div className='input-group flex flex-col gap-1 mb-5'>
                        <label htmlFor='folder-name' className='text-black text-lg'>Folder Name</label>
                        <div className='flex items-center py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                            <MdOutlineSubtitles size={20} className='text-gray-400' />
                            <input
                                id='folder-name'
                                type='text'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className='w-[95%] outline-none ml-1'
                                placeholder='Enter folder name'
                                required
                            />
                        </div>
                    </div>

                    <div className='input-group flex flex-col gap-1 mb-5'>
                        <label htmlFor='folder-cover' className='text-black text-lg'>
                            Folder Cover
                            <span className='text-gray-400 text-sm ml-2'>
                                (cropped to {COVER_SIZE}×{COVER_SIZE})
                            </span>
                        </label>
                        <div className='flex items-center py-2 px-1 border-gray-400 border-2 hover:border-indigo-500 rounded-md'>
                            <MdImage size={20} className='text-gray-400' />
                            <input
                                id='folder-cover'
                                type='file'
                                accept='image/*'
                                onChange={handlePhotoChange}
                                className='w-[95%] outline-none ml-1'
                            />
                        </div>
                    </div>

                    {(photo || folder?.cover) && (
                        <div className='flex items-center justify-center mb-5'>
                            <img
                                src={photo || folder.cover}
                                alt='folder cover'
                                className='w-[8rem] h-[8rem] rounded-lg object-cover bg-gray-100'
                            />
                        </div>
                    )}

                    <div className='flex justify-between items-center mb-2'>
                        <label className='text-black text-lg'>Songs</label>
                        <span className='text-gray-500'>{selectedSongs.length} selected</span>
                    </div>
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Search songs...'
                        className='w-full outline-none mb-3 py-2 px-2 border-gray-400 border-2 hover:border-indigo-500 rounded-md'
                    />

                    <div className='max-h-[14rem] overflow-y-auto border border-gray-200 rounded-md p-2 mb-5'>
                        {visibleSongs.length === 0
                            ? <p className='text-gray-400 text-center py-4'>No songs found</p>
                            : visibleSongs.map((song) => (
                                <div key={song._id} className='flex justify-between items-center my-3'>
                                    <div className='flex items-center gap-4'>
                                        <CoverThumb src={song.cover} size={40} alt={song.title} />
                                        <h2 className='text-black'>{song?.title}</h2>
                                    </div>
                                    <input
                                        type='checkbox'
                                        className='p-4 mr-4'
                                        checked={selectedSongs.includes(String(song._id))}
                                        onChange={() => handleCheckbox(song._id)}
                                    />
                                </div>
                            ))}
                    </div>

                    <div className='flex justify-center items-center pb-4'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-all disabled:opacity-50'
                        >
                            {loading ? 'Loading...' : isEdit ? 'Update Folder' : 'Create Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
};

export default FolderComponents;
