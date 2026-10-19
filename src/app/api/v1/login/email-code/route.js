import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { readPendingLogin, sendLoginOtp } from "@/utils/loginSession";

// "Email me a code instead": for a user with the authenticator app turned on
// who does not have their phone. Only works after the password step.
export const POST = connectDB(async function (req) {
    try {
        const pendingId = readPendingLogin(req);
        if (!pendingId) throw new Error("Your login expired. Please enter your email and password again.");

        const user = await userModel.findById(pendingId);
        if (!user) throw new Error("Your login expired. Please enter your email and password again.");

        await sendLoginOtp(user);
        return NextResponse.json({ success: true, message: 'OTP send to your email' }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message || 'Internal Seerver Error' }, { status: 401 });
    }
});
