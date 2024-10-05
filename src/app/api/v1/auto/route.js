
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import autoModel from "@/models/auto";
import { auth } from "@/middleswares/auth";

export const POST = connectDB(auth(async function (req){
    const {playlists} = await req.json();
    return NextResponse.json({success: true,auto});
}));

export const GET = connectDB(auth(async function (req){
    const {_id} = req.user;
    const auto = await autoModel.find({owner: _id}).populate('owner');

    return NextResponse.json({success: true,auto});
}));