import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import announcementModel from "@/models/announcement";
import { auth } from "@/middleswares/auth";


export const POST = connectDB(auth(async function (req){

    try{
         const {message} = await req.json();
        
         let announcement = await announcementModel.findOne({owner: req.user._id});
         if(announcement){
            announcement.message = message;
            await announcement.save();
         }else{
            announcement = await announcementModel.create({message,owner: req.user._id})
         }

        return NextResponse.json({success: true,message: 'update successfully'})
        
    }catch(err){
        return NextResponse.json({success: false,message: 'Internal Seerver Error'},{status: 501});
    }
}));

export const GET = connectDB(auth(async function (req){
    try{
        let announcement = await announcementModel.findOne({owner: req.user._id});
        return NextResponse.json({success: true,announcement})
    }catch(err){
        return NextResponse.json({success: false,message: 'Internal Seerver Error'},{status: 501});
    }
}))