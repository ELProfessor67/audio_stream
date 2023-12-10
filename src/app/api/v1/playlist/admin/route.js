
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    const {djOwner} = req.user;
    const playlists = await playlistModel.find({owner: djOwner}).populate('owner').populate('songs');

    return NextResponse.json({success: true,playlists});
}));