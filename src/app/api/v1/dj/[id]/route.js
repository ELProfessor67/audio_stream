import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";


export const GET = connectDB(auth(async function (req){
    try{
        const id = req.url.split('/')[6];
        const team = await userModel.findById(id);
        return NextResponse.json({success: true,team});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))


export const PUT = connectDB(auth(async function (req){
    try{
        const id = req.url.split('/')[6];
        const {name,email,password,permissions,starttime,endtime,djDate,djTimeInDays,djDays, rawTime} = await req.json();
        

        const team = await userModel.findByIdAndUpdate(id,{name,email,djPermissions: permissions,djStartTime:starttime,
            djEndTime: endtime,djDate,djTimeInDays,djDays, rawTime});
            if(password){
                team.password = password;
                team.save();
            }
            
        // console.log(team,starttime,endtime)
        return NextResponse.json({success: true,message: 'update success'});
    }catch(err){
        return NextResponse.json({success: false,message: err.message},{status: 501});
    }
}))