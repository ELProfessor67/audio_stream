
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    const playlistId = req.url.split('/')[6];
    
     let playlist = await playlistModel.findById(playlistId).populate('owner').populate('songs');
     playlist = JSON.parse(JSON.stringify(playlist));
        playlist.songs = playlist.songs.map((song) => {
            return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
        });
    return NextResponse.json({success: true,playlist});
}));


export const POST = connectDB(auth(async function (req){
    try{
        const {songs,title,album,artist} = await req.json();
       
        const playlistId = req.url.split('/')[6];
        
        await playlistModel.findByIdAndUpdate(playlistId,{songs,title,album,artist});

        return NextResponse.json({success: true,message: 'update successfully'});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}));