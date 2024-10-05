
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";
import axios from "axios";

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
    console.log("inside....",playlists)
    if(req.user.isDJ && req.user.djPermissions.includes('playlists')){
        let adminplaylists = await playlistModel.find({owner: req.user.djOwner}).populate('owner').populate('songs');
        adminplaylists.forEach(p => {
            playlists.push(p)
        })
        
    }
    console.log("inside....",playlists[0].songs)
    playlists = playlists.filter((ele) => !ele.isTemp);

    playlists = JSON.parse(JSON.stringify(playlists));
    playlists.forEach((playlist,index) => {
        playlists[index].songs = playlists[index].songs.map((song) => {
            return {...song,audio: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.audio}`,cover: `${process.env.NEXT_PUBLIC_SOCKET_URL}${song.cover}`}
        });
    })
    
    //add album and artist
    let playListCopy = JSON.parse(JSON.stringify(playlists));
    playListCopy.forEach((p,index) => {
        if(p.cover){
            p.cover = `${process.env.NEXT_PUBLIC_SOCKET_URL}${p.cover}`
        }else{
            p.cover = `${process.env.NEXT_PUBLIC_SOCKET_URL}/upload/cover/default.jpg`
        }
        playListCopy[index].songs = playListCopy[index].songs.map((song) => {
            if(p.artist){
                song.artist = p.artist;
            }else
            {
                song.artist = "Unkown";
            }

            if(p.album){
                song.album = p.album;
            }else
            {
                song.album = "Unkown";
            }
            song.cover = p.cover;
           

            
            return song;
        })
        
    })

    return NextResponse.json({success: true,playlists: playListCopy});
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