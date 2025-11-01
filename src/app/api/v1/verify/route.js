import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import jwt from "jsonwebtoken";

export const POST = connectDB(async function (req) {
    try {
        const { OTP } = await req.json();
        const user = await userModel.findOne({OTP});
        if(!user) throw new Error("Invalid OTP or expired")
        const res = NextResponse.json({ success: true, message: 'Login Sucessfully', user }, { status: 200 });
        
        const token = await user.getJWTToken();

        res.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            expires: new Date(Date.now() + Number(process.env.TOEKN_EXPIRE) * 60 * 60 * 1000)
        });

        return res;
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message || 'Internal Seerver Error' }, { status: 501 });
    }
});