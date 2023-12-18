
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    const {djOwner} = req.user;
    let playlists = await playlistModel.find({owner: djOwner}).populate('owner').populate('songs');
    playlists = playlists.filter((ele) => !ele.isTemp);
    return NextResponse.json({success: true,playlists});
}));