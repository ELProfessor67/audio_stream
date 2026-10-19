import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { verifyTotp } from "@/utils/totp";
import { clearPendingLogin, publicUser, readPendingLogin } from "@/utils/loginSession";

export const POST = connectDB(async function (req) {
    try {
        const { OTP, method } = await req.json();
        const code = String(OTP || '').trim();
        const pendingId = readPendingLogin(req);

        let user;
        if (pendingId) {
            // Step 2 of a login that passed the password on this browser.
            user = await userModel.findById(pendingId).select('+twoFactorSecret +twoFactorLastStep');
            if (!user) throw new Error("Invalid OTP or expired");

            let ok = false;
            if (user.twoFactorEnabled && method !== 'email') {
                const step = verifyTotp(user.twoFactorSecret, code, user.twoFactorLastStep);
                if (step != null) {
                    ok = true;
                    user.twoFactorLastStep = step;
                }
            }
            // Emailed code: the normal path, or the fallback a 2FA user asked for.
            if (!ok && user.OTP && String(user.OTP) === code) ok = true;

            if (!ok) {
                throw new Error(user.twoFactorEnabled && method !== 'email'
                    ? "Invalid authenticator code. Check the time on your phone and try the newest code."
                    : "Invalid OTP or expired");
            }
        } else {
            // Login started before this release, without the step cookie.
            // Accounts with the authenticator on must use the new flow.
            user = await userModel.findOne({ OTP: code });
            if (!user || user.twoFactorEnabled) throw new Error("Invalid OTP or expired");
        }

        // A code works once.
        user.OTP = undefined;
        const token = await user.getJWTToken();
        user.jwt = token;
        await user.save();

        const res = NextResponse.json({ success: true, message: 'Login Sucessfully', user: publicUser(user) }, { status: 200 });

        res.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            expires: new Date(Date.now() + Number(process.env.TOEKN_EXPIRE) * 60 * 60 * 1000)
        });
        clearPendingLogin(res);

        return res;
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message || 'Internal Seerver Error' }, { status: 501 });
    }
});
