import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";


export const POST = connectDB(async function (req){
    const {name,email,password,country,station_name,website_url,timezone} = await req.json();
    

    const userExist = await userModel.findOne({email});
    
    if (userExist) return NextResponse.json({success: false,message: 'user already exist'},{status: 401});

    if (!name || !email || !password || !country || !station_name || !timezone) return NextResponse.json({success: false,message: 'all fields are requiree'},{status: 401});

    const user = await userModel.create({name,email,password,country,station_name,website_url,timezone});

    const res = NextResponse.json({success: true,message: 'register succussfully',user},{status: 201});

    const token = await user.getJWTToken();
    res.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        expires: new Date(Date.now() + Number(process.env.TOEKN_EXPIRE) * 24 * 60 * 60 * 1000)
    });

    return res;
});


export function GET(req){
    return new Response('cannot GET')
}