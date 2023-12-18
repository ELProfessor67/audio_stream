import playlistModel from "@/models/playlist";
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import filterModel from "@/models/filter";
import { auth } from "@/middleswares/auth";
import {writeFileSync} from 'fs';
import path from 'path';


export const POST = connectDB(auth(async function (req){
    const {title,audio,audioEx,size,type,duration} = await req.json();

    // upload file 
    const filterAudioData = audio.substr(audio.indexOf(',')+1);
    // const filterCoverData = cover.substr(cover.indexOf(',')+1);
    const bufferAudio = new Buffer(filterAudioData,'base64');
    // const bufferCover = new Buffer(filterCoverData,'base64');
    const audioFileName = `${title}-${Date.now()}.${audioEx}`;
    // const coverFileName = `${title}-${Date.now()}.${coverEx}`;
    writeFileSync(`./public/upload/songs/${audioFileName}`,bufferAudio,'binary');
    // writeFileSync(`./public/upload/cover/${coverFileName}`,bufferCover,'binary');

    const filter = await filterModel.create({title,size,type,audio: `/upload/songs/${audioFileName}`,cover:`/upload/cover/filter.jpeg`,owner: req.user._id,duration});
    
    return NextResponse.json({success: true,message: 'filter upload successfully'});
    

}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let filter = await filterModel.find({owner: _id}).populate('owner');
    return NextResponse.json({success: true,filter});
}));