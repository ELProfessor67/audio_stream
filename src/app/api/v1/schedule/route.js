
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import scheduleModel from "@/models/schedule";
import { auth } from "@/middleswares/auth";
import axios from 'axios';

export const POST = connectDB(auth(async function (req){
    let {date,time,songs,ads} = await req.json();

    if(ads !== 0){
        const allSongs = await songModel.find({owner: req.user._id});
        const allads = allSongs.filter(song => song.isAds);
        if(allads.length !== 0){
            const newSongs = [];
            for(let i = 0; i < songs.length; i++){
                newSongs.push(songs[i]);
                if((i+1)%ads === 0 && i+1 !== songs.length){
                    const randomIndex = Math.floor(Math.random() * allads.length);
                    newSongs.push(allads[randomIndex]._id.toString());
                }
            }

            songs = newSongs;
        }
    }

    console.log(date,time,songs,ads)

    if(!date || !time) return NextResponse.json({success: false,message: 'all fields are required'});

    const schedule = await scheduleModel.create({date,time,songs,songsPerAds:ads,owner: req.user._id});

    // ads cron jobs pending
    console.log(`${process.env.NEXT_PUBLIC_SOCKET_URL}/refresh`);
    try{
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SOCKET_URL}/refresh`);
        console.log('res',res?.data);
    }catch(err){
        console.log(err)
    }
    

    return NextResponse.json({success: true,message: 'schedule create successfully',schedule});
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
        try{
            const res = await axios.get(`${process.env.NEXT_PUBLIC_SOCKET_URL}/refresh`);
            console.log('res',res?.data);
        }catch(err){
            console.log(err)
        }
        
        return NextResponse.json({success: true,message: 'schedule cancel successfully'})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))