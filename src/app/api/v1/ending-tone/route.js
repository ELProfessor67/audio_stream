
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userSchema from "@/models/user";
import { auth } from "@/middleswares/auth";
import playlistModel from "@/models/playlist";
import axios from 'axios';

export const POST = connectDB(auth(async function (req){
    try{
        const {audio,audioEx} = await req.json();
        // if already exist then delete
        if(req.user?.endingTone){
            try{
                const post = await axios.delete(`${process.env.NEXT_PUBLIC_SOCKET_URL}/delete?id=${req.user?.endingTone}`)
            }catch(err){
                return NextResponse.json({success: false,message: err?.response?.data?.message});
            }
        }
        // upload file 

        const audioFileName = `${req.user._id}-${Date.now()}.${audioEx}`;
        
        try{
            const post = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`,{
                filename: `/upload/songs/${audioFileName}`,
                base64: audio
            })
        }catch(err){
            return NextResponse.json({success: false,message: err?.response?.data?.message},{status: 501});
        }
        
        await userSchema.findByIdAndUpdate(req.user._id,{endingTone: `/upload/songs/${audioFileName}`})

        return NextResponse.json({success: true,message: 'welcome tone upload successfully'});
    }catch(err){
         return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}));