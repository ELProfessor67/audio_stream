import playlistModel from "@/models/playlist";
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import filterModel from "@/models/filter";
import { auth } from "@/middleswares/auth";
import {writeFileSync} from 'fs';
import path from 'path';
import axios from 'axios';


export const POST = connectDB(auth(async function (req){
    const {title,audio,audioEx,size,type,duration} = await req.json();

    // upload file 
    // const filterAudioData = audio.substr(audio.indexOf(',')+1);
    // const filterCoverData = cover.substr(cover.indexOf(',')+1);
    // const bufferAudio = new Buffer(filterAudioData,'base64');
    // const bufferCover = new Buffer(filterCoverData,'base64');
    const audioFileName = `${title}-${Date.now()}.${audioEx}`;
    // const coverFileName = `${title}-${Date.now()}.${coverEx}`;
    // writeFileSync(`./public/upload/songs/${audioFileName}`,bufferAudio,'binary');
    // writeFileSync(`./public/upload/cover/${coverFileName}`,bufferCover,'binary');
    try{
        const post = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`,{
            filename: `/upload/songs/${audioFileName}`,
            base64: audio
        })
    }catch(err){
        return NextResponse.json({success: false,message: err?.response?.data?.message});
    }

    let filter = await filterModel.create({title,size,type,audio: `/upload/songs/${audioFileName}`,cover:`/upload/cover/filter.jpeg`,owner: req.user._id,duration});

    filter = JSON.parse(JSON.stringify(filter))
    filter.audio = `${process.env.NEXT_PUBLIC_SOCKET_URL}${filter.audio}`
    filter.cover = `${process.env.NEXT_PUBLIC_SOCKET_URL}${filter.cover}`
    
    return NextResponse.json({success: true,message: 'filter upload successfully',filter});
    

}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let filter = await filterModel.find({owner: _id}).populate('owner');
    filter = filter.map((song) => {
        song = JSON.parse(JSON.stringify(song));
        return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
    });
    return NextResponse.json({success: true,filter});
}));



export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        const song = await filterModel.findById(id);
        // unlink(`.${song.audio}`,(err) => {
        //     if(err){
        //         console.log(err)
        //     }
        //     console.log('delete successfully');
        // });
        console.log('1')
        try{
            const post = await axios.delete(`${process.env.NEXT_PUBLIC_SOCKET_URL}/delete?id=${song.audio}`)
            console.log(`${process.env.NEXT_PUBLIC_SOCKET_URL}/delete?id=${song.audio}`)
        }catch(err){
            console.log(err.message)
            return NextResponse.json({success: false,message: err?.response?.data?.message});
        }
        console.log('2')

        console.log('3')
        
        await filterModel.findByIdAndDelete(id);
        return NextResponse.json({success: true,message: 'delete successfully'})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))