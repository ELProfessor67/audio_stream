
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";
import axios from "axios";
import { resolveMedia, withResolvedMedia } from "@/utils/mediaUrl";

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
    let playlists = await playlistModel.find({owner: _id}).populate('owner').populate('songs');

    // Every DJ also gets the admin library. Albums approved on HGC Radio are
    // synced onto the admin account, so this is what makes an approved album
    // visible in the DJ panel and in Go Live for all DJs.
    if(req.user.isDJ && req.user.djOwner && String(req.user.djOwner) !== String(_id)){
        const adminplaylists = await playlistModel.find({owner: req.user.djOwner}).populate('owner').populate('songs');
        const seen = new Set(playlists.map((p) => String(p._id)));
        adminplaylists.forEach((p) => {
            if(!seen.has(String(p._id))){
                seen.add(String(p._id));
                playlists.push(p);
            }
        })
    }

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