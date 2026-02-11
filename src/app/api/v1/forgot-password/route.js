import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import crypto from 'crypto';
import axios from 'axios';

export const POST = connectDB(async function (req) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });

        const user = await userModel.findOne({ email });
        if (!user) return NextResponse.json({ success: true, message: 'If this email exists, a reset link has been sent' }, { status: 200 });

        // Generate token and set expiry
        const resetToken = user.getResetToken();
        await user.save();

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const resetUrl = `${baseUrl}/reset/${resetToken}`;
        console.log(resetUrl,"helllo");

        // Use same external mailer service pattern as verify route
        try {
            await axios.post('https://mailing.hgcradio.org/send-email', {
                email: user.email,
                subject: "Password Reset",
                message: `Reset your password using this link: ${resetUrl}`
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Mailer error:', error?.response?.data || error?.message);
        }

        return NextResponse.json({ success: true, message: 'Reset link sent to your email' }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
});


