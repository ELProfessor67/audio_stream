
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";

export const POST = connectDB(auth(async function (req){
    const {title,description,songs} = await req.json();

    if(!title || !description || !songs) return NextResponse.json({success: false,message: 'all fields are required'});

    const playlist = await playlistModel.create({title,description,songs,owner: req.user._id});

    return NextResponse.json({success: true,message: 'playlist create successfully'});
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    const playlists = await playlistModel.find({owner: _id}).populate('owner').populate('songs');

    return NextResponse.json({success: true,playlists});
}));