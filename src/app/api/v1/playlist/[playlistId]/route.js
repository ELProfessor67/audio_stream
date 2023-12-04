
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    const playlistId = req.url.split('/')[6];
    
     const playlist = await playlistModel.findById(playlistId).populate('owner').populate('songs');

    return NextResponse.json({success: true,playlist});
}));


export const POST = connectDB(auth(async function (req){
    try{
        const {songs} = await req.json();
        console.log(songs)
        const playlistId = req.url.split('/')[6];
        
        await playlistModel.findByIdAndUpdate(playlistId,{songs});

        return NextResponse.json({success: true,message: 'update successfully'});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}));