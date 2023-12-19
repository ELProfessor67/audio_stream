import playlistModel from "@/models/playlist";
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
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

    const song = await songModel.create({title,description:'description',artist:'ads',size,type,audio: `/upload/songs/${audioFileName}`,cover:`/upload/cover/ads.jpeg`,owner: req.user._id,isAds: true,duration});

    const adsPlaylist = await playlistModel.findOne({title: 'Ads',owner: req.user._id});
    if(adsPlaylist){
        const prevAds = adsPlaylist.songs;
        await playlistModel.findByIdAndUpdate(adsPlaylist._id,{songs: [...prevAds,song._id]})
    }else{
        const playlist = await playlistModel.create({title: 'Ads',description:'this playlist only for ads',songs:[song._id],owner: req.user._id});
    }
    
    return NextResponse.json({success: true,message: 'ads upload successfully'});
    

}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    let songs = await songModel.find({owner: _id}).populate('owner');
    songs = songs.filter(song => song.isAds)
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