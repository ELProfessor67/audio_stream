import playlistModel from "@/models/playlist";
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import { auth } from "@/middleswares/auth";
import {writeFileSync} from 'fs';
import path from 'path';


export const POST = connectDB(auth(async function (req){
    const {title,audio,audioEx,size,type} = await req.json();

    // upload file 
    const filterAudioData = audio.substr(audio.indexOf(',')+1);
    // const filterCoverData = cover.substr(cover.indexOf(',')+1);
    const bufferAudio = new Buffer(filterAudioData,'base64');
    // const bufferCover = new Buffer(filterCoverData,'base64');
    const audioFileName = `${title}-${Date.now()}.${audioEx}`;
    // const coverFileName = `${title}-${Date.now()}.${coverEx}`;
    writeFileSync(`./public/upload/songs/${audioFileName}`,bufferAudio,'binary');
    // writeFileSync(`./public/upload/cover/${coverFileName}`,bufferCover,'binary');

    const song = await songModel.create({title,description:'description',artist:'ads',size,type,audio: `/upload/songs/${audioFileName}`,cover:`/upload/cover/ads.jpeg`,owner: req.user._id,isAds: true});

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

    return NextResponse.json({success: true,songs});
}));