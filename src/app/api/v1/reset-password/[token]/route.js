import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import crypto from 'crypto';

export const POST = connectDB(async function (req, { params }) {
    try {
        const { token } = params;
        const { password } = await req.json();
        if (!password) return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 });

        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await userModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return NextResponse.json({ success: false, message: 'Reset link is invalid or expired' }, { status: 400 });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: 'Password updated successfully' }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
});


