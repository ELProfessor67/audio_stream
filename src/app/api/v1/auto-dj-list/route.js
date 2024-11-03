
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import autoDJListModel from "@/models/autoDJList";
import { auth } from "@/middleswares/auth";
import axios from "axios";


let timeoutref = null;

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

    if(timeoutref) clearTimeout(timeoutref);
    timeoutref = setTimeout(() => {
        axios.get(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/v1/list-change`).then((res) => console.log(res.data)).catch((err) => console.log(err.message));
    }, 60000);
    return NextResponse.json({success: true, autoDJList});
}));

export const GET = connectDB(auth(async function (req){
    const user = req.user; 
    let autoDJList = await autoDJListModel.findOne({owner: user._id}).populate('songs.data').sort({ 'songs.index': -1 });
    return NextResponse.json({success: true,autoDJList});
}));