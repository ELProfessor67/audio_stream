
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import userModel from "@/models/user";
import scheduleModel from "@/models/schedule";


export const GET = connectDB(async function (req){
    const id = req.url.split('/')[6];
    
     let user = await userModel.findById(id);
     if(!user) return  NextResponse.json({success: false,message: 'invalid id'},{status: 404});
     let songs = await songModel.find({owner: id});
     songs = songs.filter(song => !song.isAds);
     let schedules = await scheduleModel.find({owner: id,status: 'pending'});

     const userMailFiel = {
        name: user.name,
        avatar: user?.avatar?.url || null
     }
    return NextResponse.json({success: true,user: userMailFiel,schedules,songs},{headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
});