
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";
import axios from "axios";
import { resolveMedia, withResolvedMedia } from "@/utils/mediaUrl";
import { HGC_SOURCE } from "@/utils/hgcLibrary";

export const POST = connectDB(auth(async function (req){
    let {title,description,songs,isTemp,album,artist,cover,coverEx} = await req.json();
    if(isTemp === undefined){
        isTemp = false
    }else{
        isTemp = true
    }

    let coverFileName = 'default.jpg'
    if(cover){
            coverFileName = `${title}-${Date.now()}.${coverEx}`;
            
            try{
                const post = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`,{
                    filename: `/upload/cover/${coverFileName}`,
                    base64: cover
                })
                console.log('upload successfully')
            }catch(err){
                return NextResponse.json({success: false,message: err?.response?.data});
            }
    }

    if(!title || !description || !songs) return NextResponse.json({success: false,message: 'all fields are required'});

    const playlist = await playlistModel.create({title,description,songs,owner: req.user._id, isTemp,album,artist,cover: `/upload/cover/${coverFileName}`});

    return NextResponse.json({success: true,message: 'playlist create successfully'});
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    // let playlists = await playlistModel.find({owner: _id}).populate('owner').populate('songs');
    let playlists = await playlistModel.find().populate('owner').populate('songs');

    const seen = new Set(playlists.map((p) => String(p._id)));
    const merge = (extra) => extra.forEach((p) => {
        if(!seen.has(String(p._id))){
            seen.add(String(p._id));
            playlists.push(p);
        }
    });

    // A DJ broadcasts out of the station admin's library, not their own.
    if(req.user.isDJ && req.user.djOwner && String(req.user.djOwner) !== String(_id)){
        merge(await playlistModel.find({owner: req.user.djOwner}).populate('owner').populate('songs'));
    }

    // Albums approved on HGC Radio belong to the station, so every DJ and the
    // owner gets them no matter which account they were synced onto.
    merge(await playlistModel.find({source: HGC_SOURCE}).populate('owner').populate('songs'));

    playlists = playlists.filter((ele) => !ele.isTemp);
    playlists = JSON.parse(JSON.stringify(playlists));

    playlists.forEach((playlist,index) => {
        const cover = resolveMedia(playlist.cover || '/upload/cover/default.jpg');
        playlists[index].cover = cover;
        playlists[index].songs = (playlist.songs || []).map((song) => ({
            ...withResolvedMedia(song),
            artist: playlist.artist || 'Unkown',
            album: playlist.album || 'Unkown',
            cover,
        }));
    })

    return NextResponse.json({success: true,playlists});
}));


export const DELETE = connectDB(auth(async function (req){
    try{
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if(!id) return NextResponse.json({success: false,message: 'please id is required'},{status: 401});
        const playlist = await playlistModel.findByIdAndDelete(id);
        return NextResponse.json({success: true,message: 'delete successfully'})
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))