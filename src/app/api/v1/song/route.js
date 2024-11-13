
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import { auth } from "@/middleswares/auth";
import {writeFileSync,unlink} from 'fs';
import path from 'path';
import playlistModel from "@/models/playlist";
import axios from 'axios';

export const POST = connectDB(auth(async function (req){
    try{
        let {title,description,artist,size,type,audio,cover,audioEx,coverEx,duration,album,isUploadfromlive,playlisttitle} = await req.json();
        
        let title2 = title?.replaceAll(' ','')?.replaceAll('mp3','');
        // upload file 
        let coverFileName;
        console.log('1')
        if(cover.includes('/upload/cover/default.jpg')){
            coverFileName = 'default.jpg'
        }else{
            // const filterCoverData = cover.substr(cover.indexOf(',')+1);
            // const bufferCover = new Buffer(filterCoverData,'base64');
            coverFileName = `${title2}-${Date.now()}.${coverEx}`;
            // writeFileSync(`./public/upload/cover/${coverFileName}`,bufferCover,'binary');
            try{
                const post = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`,{
                    filename: `/upload/cover/${coverFileName}`,
                    base64: cover
                })
                console.log('upload successfully')
            }catch(err){
                return NextResponse.json({success: false,message: err?.response?.data?.message});
            }
        }
        console.log('2')

        // const filterAudioData = audio.substr(audio.indexOf(',')+1);
        // const bufferAudio = new Buffer(filterAudioData,'base64');
        const audioFileName = `${title2}-${Date.now()}.${audioEx}`;
        console.log(audioFileName)
        // writeFileSync(`./public/upload/songs/${audioFileName}`,bufferAudio,'binary');
        try{
            const post = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`,{
                filename: `/upload/songs/${audioFileName}`,
                base64: audio
            })
        }catch(err){
            console.log(err.message)
            return NextResponse.json({success: false,message: err?.response?.data?.message},{status: 501});
        }
        console.log('3')
        
        let song = await songModel.create({title,description,artist,size,type,audio: `/upload/songs/${audioFileName}`,cover:`/upload/cover/${coverFileName}`,owner: req.user._id,duration,album});

        song = JSON.parse(JSON.stringify(song));
        song.cover = `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`
        song.audio = `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`
        console.log('4')
        if(isUploadfromlive){
            const p = await playlistModel.findOne({title: playlisttitle});
            p.songs.push(song._id);
            await p.save()
        }

        return NextResponse.json({success: true,message: 'songs upload successfully',song});
    }catch(err){
         return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let songs = await songModel.find({owner: _id}).populate('owner');
    
    songs = songs.filter(song => !song.isAds)
    songs = songs.map((song) => {
        song = JSON.parse(JSON.stringify(song));
        return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
    });

    return NextResponse.json({success: true,songs});
}));


export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        const song = await songModel.findById(id);
        // unlink(`.${song.audio}`,(err) => {
        //     if(err){
        //         console.log(err)
        //     }
        //     console.log('delete successfully');
        // });
        try{
            const post = await axios.delete(`${process.env.NEXT_PUBLIC_SOCKET_URL}/delete?id=${song.audio}`)
        }catch(err){
            return NextResponse.json({success: false,message: err?.response?.data?.message});
        }

        if(song.cover != '/upload/cover/default.jpg'){
            // unlink(`.${song.cover}`,(err) => {
            //     if(err){
            //         console.log(err)
            //     }
            //     console.log('delete successfully');
            // });
            try{
                const post = await axios.delete(`${process.env.NEXT_PUBLIC_SOCKET_URL}/delete?id=${song.cover}`)
            }catch(err){
                return NextResponse.json({success: false,message: err?.response?.data?.message});
            }
        }

        const playlists = await playlistModel.find();
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