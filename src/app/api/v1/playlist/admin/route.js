
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    const {djOwner} = req.user;
    let playlists = await playlistModel.find({owner: djOwner}).populate('owner').populate('songs');
    playlists = playlists.filter((ele) => !ele.isTemp);
    playlists = JSON.parse(JSON.stringify(playlists));
    playlists.forEach((playlist,index) => {
        playlists[index].songs = playlists[index].songs.map((song) => {
            return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
        });
    })
    return NextResponse.json({success: true,playlists});
}));