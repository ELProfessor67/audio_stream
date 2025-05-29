
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import scheduleModel from "@/models/schedule";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";
import axios from 'axios';

export const POST = connectDB(auth(async function (req){
    let {day,songs,role} = await req.json();

    console.log(day,songs,role)
    if(role){
        const user = await userModel.findByIdAndUpdate(req.user._id,{role});
    }

    if(!day) return NextResponse.json({success: false,message: 'all fields are required'});

    const schedule = await scheduleModel.create({day,songs,owner: req.user._id,enabled: true});

    return NextResponse.json({success: true,message: 'scheduled successfully',schedule});
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let schedules = await scheduleModel.find({owner: _id}).populate('owner').populate('songs');
    schedules = JSON.parse(JSON.stringify(schedules));
    schedules.forEach((playlist,index) => {
        schedules[index].songs = schedules[index].songs.map((song) => {
            return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
        });
    })
    
    return NextResponse.json({success: true,schedules});
}));


export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        await scheduleModel.findByIdAndDelete(id);        
        return NextResponse.json({success: true,message: 'schedule cancel successfully'})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))