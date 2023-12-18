
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import { auth } from "@/middleswares/auth";
import {writeFileSync,unlink} from 'fs';
import path from 'path';
import playlistModel from "@/models/playlist";

export const POST = connectDB(auth(async function (req){
    try{
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
    }catch(err){
         return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let songs = await songModel.find({owner: _id}).populate('owner');
    
    songs = songs.filter(song => !song.isAds)

    return NextResponse.json({success: true,songs});
}));


export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        const song = await songModel.findById(id);
        unlink(`.${song.audio}`,(err) => {
            if(err){
                console.log(err)
            }
            console.log('delete successfully');
        });

        if(song.cover != '/upload/cover/default.jpg'){
            unlink(`.${song.cover}`,(err) => {
                if(err){
                    console.log(err)
                }
                console.log('delete successfully');
            });
        }

        const playlists = await playlistModel.find({owner: req.user._id});
        playlists.forEach(async (playlist) => {
            if(playlist.songs.includes(song._id)){
                let playsong = playlist.songs.filter(id => id != song._id);
                if(playsong.length == 0){
                    await playlistModel.findByIdAndDelete(playlist._id);
                }else{
                    await playlistModel.findByIdAndUpdate(playlist._id,{songs: playsong});
                }
                
            }
        })
        await songModel.findByIdAndDelete(id);
        return NextResponse.json({success: true,message: 'delete successfully'})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))