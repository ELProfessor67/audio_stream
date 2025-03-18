import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import scheduleModel from "@/models/schedule";
import { auth } from "@/middleswares/auth";
import songModel from "@/models/song";
import axios from 'axios';


export const GET = connectDB(auth(async function (req){
    try{
        const id = req.url.split('/')[6];
        const schedule = await scheduleModel.findById(id);

        const allSongs = await songModel.find({owner: req.user._id});
        let allads = allSongs.filter(song => song.isAds);
        allads = allads.map(song => song._id.toString());

        let copyShedule = JSON.parse(JSON.stringify(schedule));
        copyShedule.songs.forEach((id,i) => {
            if(allads.includes(id)){
                copyShedule.songs.splice(i,1);
            }
        });

        // copyShedule = JSON.parse(JSON.stringify(copyShedule));
        // copyShedule.songs = copyShedule.songs.map((song) => {
        //     return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
        // });

        return NextResponse.json({success: true,schedule:copyShedule});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))


export const PUT = connectDB(auth(async function (req){
    try{
        const id = req.url.split('/')[6];
        if(!id) return NextResponse.json({success: false,message: 'is is required'});
        let {day,songs,enabled} = await req.json();






        const data = {};
        console.log(enabled)
        if(enabled != undefined) data.enabled = enabled;
        if(day) data.day = day;
        if(songs) data.songs = songs;
        const schedule = await scheduleModel.findByIdAndUpdate(id,data);
        return NextResponse.json({success: true,message: 'update success'});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))