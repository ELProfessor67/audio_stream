import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { readPendingLogin, sendLoginOtp, setPendingLogin } from "@/utils/loginSession";

// Sends a new emailed login code. Used by "Resend code" on the OTP page and by
// "Email me a code instead" for an authenticator-app user without their phone.
// Only works after the password step. The new code replaces the old one.
export const POST = connectDB(async function (req) {
    try {
        const pendingId = readPendingLogin(req);
        if (!pendingId) throw new Error("Your login expired. Please enter your email and password again.");

        const user = await userModel.findById(pendingId);
        if (!user) throw new Error("Your login expired. Please enter your email and password again.");

        await sendLoginOtp(user);
        const res = NextResponse.json({ success: true, message: 'A new code was sent to your email' }, { status: 200 });
        // Restart the 10-minute window so the new code has its full time.
        setPendingLogin(res, user._id);
        return res;
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message || 'Internal Seerver Error' }, { status: 401 });
    }
});
