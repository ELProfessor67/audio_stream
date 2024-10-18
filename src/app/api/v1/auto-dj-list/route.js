
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import autoDJListModel from "@/models/autoDJList";
import { auth } from "@/middleswares/auth";


export const POST = connectDB(auth(async function (req){
    let {songs} = await req.json();
    const user = req.user;
    let autoDJList = await autoDJListModel.findOne({owner: user._id}).populate('songs.data');
    if(autoDJList){
        autoDJList.songs = songs;
        await autoDJList.save()
    }else{
        autoDJList = autoDJListModel.create({owner: user._id,songs});
    }
    return NextResponse.json({success: true, autoDJList});
}));

export const GET = connectDB(auth(async function (req){
    const user = req.user; 
    let autoDJList = await autoDJListModel.findOne({owner: user._id}).populate('songs.data').sort({ 'songs.index': -1 });
    return NextResponse.json({success: true,autoDJList});
}));