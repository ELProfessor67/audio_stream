
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";
import { resolveMedia, withResolvedMedia } from "@/utils/mediaUrl";


export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    const playlistId = req.url.split('/')[6];
    
     let playlist = await playlistModel.findById(playlistId).populate('owner').populate('songs');
     playlist = JSON.parse(JSON.stringify(playlist));
        playlist.cover = resolveMedia(playlist.cover);
        playlist.songs = playlist.songs.map(withResolvedMedia);
        playlist.folders = (playlist.folders || []).map((folder) => ({
            ...folder,
            cover: resolveMedia(folder.cover),
            songs: (folder.songs || []).map(String),
        }));
    return NextResponse.json({success: true,playlist});
}));


export const POST = connectDB(auth(async function (req){
    try{
        const {songs,title,album,artist,folders} = await req.json();
       
        const playlistId = req.url.split('/')[6];

        // Undefined keys are stripped by mongoose, so callers can send just the
        // slice they are changing (song list, folder grouping, or metadata).
        const update = {songs,title,album,artist,folders};

        // Dropping a track from the playlist has to drop it from its folder too,
        // otherwise the folder keeps pointing at a song the playlist no longer has.
        if(songs && !folders){
            const playlist = await playlistModel.findById(playlistId);
            if(playlist?.folders?.length){
                const kept = new Set(songs.map(String));
                update.folders = playlist.folders.map((folder) => ({
                    ...folder.toObject(),
                    songs: folder.songs.filter((id) => kept.has(String(id))),
                }));
            }
        }

        await playlistModel.findByIdAndUpdate(playlistId,update);

        return NextResponse.json({success: true,message: 'update successfully'});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}));