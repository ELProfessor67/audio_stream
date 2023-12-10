
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import { auth } from "@/middleswares/auth";
import {writeFileSync} from 'fs';
import path from 'path';

export const POST = connectDB(auth(async function (req){
    const {title,description,artist,size,type,audio,cover,audioEx,coverEx,duration} = await req.json();

    // upload file 
    let coverFileName;
    if(cover.includes('/upload/cover/default.jpg')){
        coverFileName = 'default.jpg'
    }else{
        const filterCoverData = cover.substr(cover.indexOf(',')+1);
        const bufferCover = new Buffer(filterCoverData,'base64');
        coverFileName = `${title}-${Date.now()}.${coverEx}`;
        writeFileSync(`./public/upload/cover/${coverFileName}`,bufferCover,'binary');
    }

    const filterAudioData = audio.substr(audio.indexOf(',')+1);
    const bufferAudio = new Buffer(filterAudioData,'base64');
    const audioFileName = `${title}-${Date.now()}.${audioEx}`;
    writeFileSync(`./public/upload/songs/${audioFileName}`,bufferAudio,'binary');
    
    const song = await songModel.create({title,description,artist,size,type,audio: `/upload/songs/${audioFileName}`,cover:`/upload/cover/${coverFileName}`,owner: req.user._id,duration});

    return NextResponse.json({success: true,message: 'songs upload successfully',song});
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let songs = await songModel.find({owner: _id}).populate('owner');
    
    songs = songs.filter(song => !song.isAds)

    return NextResponse.json({success: true,songs});
}));