
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";

export const POST = connectDB(auth(async function (req){
    let {title,description,songs,isTemp} = await req.json();
    if(isTemp === undefined){
        isTemp = false
    }else{
        isTemp = true
    }

    if(!title || !description || !songs) return NextResponse.json({success: false,message: 'all fields are required'});

    const playlist = await playlistModel.create({title,description,songs,owner: req.user._id, isTemp});

    return NextResponse.json({success: true,message: 'playlist create successfully'});
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let playlists = await playlistModel.find({owner: _id}).populate('owner').populate('songs');
    playlists = playlists.filter((ele) => !ele.isTemp);

    playlists = JSON.parse(JSON.stringify(playlists));
    playlists.forEach((playlist,index) => {
        playlists[index].songs = playlists[index].songs.map((song) => {
            return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
        });
    })
    
    return NextResponse.json({success: true,playlists});
}));


export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        const playlist = await playlistModel.findByIdAndDelete(id);
        return NextResponse.json({success: true,message: 'delete successfully'})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))