import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { sendLoginOtp, setPendingLogin } from "@/utils/loginSession";

export const POST = connectDB(async function (req) {
    try {
        const { email, password } = await req.json();


        if (!email || !password) return NextResponse.json({ success: false, message: 'all fields are requiree' }, { status: 401 });

        const user = await userModel.findOne({ email });

        if (!user) return NextResponse.json({ success: false, message: 'invalid details' }, { status: 401 });

        const isMatch = await user.comparePass(password);

        if (!isMatch) return NextResponse.json({ success: false, message: 'invalid details' }, { status: 401 });

        // Authenticator app turned on: ask for its code, send no email.
        // An old emailed code must not work in its place.
        if (user.twoFactorEnabled) {
            user.OTP = undefined;
            await user.save();
            const res = NextResponse.json({ success: true, method: 'app', message: 'Enter the code from your authenticator app' }, { status: 200 });
            setPendingLogin(res, user._id);
            return res;
        }

        await sendLoginOtp(user);

        // Only a message goes back. The response used to include the whole
        // user record, which carried the emailed code and the password hash.
        const res = NextResponse.json({ success: true, method: 'email', message: 'OTP send to your email' }, { status: 200 });
        setPendingLogin(res, user._id);
        return res;
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message || 'Internal Seerver Error' }, { status: 501 });
    }
});

export const GET = async function (req) {
    const res = NextResponse.json({ success: true, message: 'logout succussfully' }, { status: 200 });
    res.cookies.set({
        name: 'token',
        value: null,
        httpOnly: true,
        expires: new Date(Date.now())
    });
    return res;
}