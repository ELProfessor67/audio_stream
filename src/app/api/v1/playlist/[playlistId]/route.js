
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