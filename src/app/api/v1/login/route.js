import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";


export const POST = connectDB(async function (req){
    const {email,password} = await req.json();
    

    if (!email || !password) return NextResponse.json({success: false,message: 'all fields are requiree'},{status: 401});

    const user = await userModel.findOne({email});

    if (!user) return NextResponse.json({success: false,message: 'invalid details'},{status: 401});

    const isMatch = await user.comparePass(password);

    if(!isMatch) return NextResponse.json({success: false,message: 'invalid details'},{status: 401});

    const res = NextResponse.json({success: true,message: 'login succussfully',user},{status: 200});

    const token = await user.getJWTToken();
    res.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        expires: new Date(Date.now() + Number(process.env.TOEKN_EXPIRE) * 24 * 60 * 60 * 1000)
    });

    return res;
});