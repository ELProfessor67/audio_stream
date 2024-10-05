
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import songModel from "@/models/song";
import userModel from "@/models/user";
import scheduleModel from "@/models/schedule";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    const allsongs = await songModel.find({owner:_id})
    const allteam = await userModel.find({isDJ: true,djOwner: _id});
    const allplaylist = await playlistModel.find({owner: _id});
    const allschedules = await scheduleModel.find({owner: _id});

    const pschedules = allschedules.filter(data => data.status === 'pending').length
    const cschedules = allschedules.filter(data => data.status === 'complete').length
    const ads = allsongs.filter(data => data.isAds).length
    const songs = allsongs.filter(data => !data.isAds).length
    const playlists = allplaylist.filter(data => data.title != 'Ads').length

    return NextResponse.json({success: true,pschedules,cschedules,ads,songs,playlists,teams: allteam.length});
}));