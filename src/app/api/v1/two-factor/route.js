import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";
import { generateSecret, otpauthUrl, verifyTotp, TOTP_ISSUER } from "@/utils/totp";

// The auth middleware swaps a DJ's _id for the station owner's on most routes.
// Two-factor settings belong to the person who is logged in, so use their own id.
const accountId = (req) => req.user?.originalId || req.user?._id;

const loadAccount = (req) =>
    userModel.findById(accountId(req)).select('+twoFactorSecret +twoFactorTempSecret +twoFactorLastStep');

export const GET = connectDB(auth(async function (req) {
    try {
        const user = await userModel.findById(accountId(req));
        if (!user) throw new Error('user not found');
        return NextResponse.json({ success: true, enabled: !!user.twoFactorEnabled }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));

export const POST = connectDB(auth(async function (req) {
    try {
        const { action, code, password } = await req.json();
        const user = await loadAccount(req);
        if (!user) throw new Error('user not found');

        if (action === 'setup') {
            // New secret, kept aside until the user proves their app has it.
            const secret = generateSecret();
            user.twoFactorTempSecret = secret;
            await user.save();
            const url = otpauthUrl(secret, user.email);
            const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 });
            return NextResponse.json({ success: true, secret, qr, issuer: TOTP_ISSUER, account: user.email }, { status: 200 });
        }

        if (action === 'enable') {
            if (!user.twoFactorTempSecret) throw new Error('Start the setup again to get a new QR code.');
            const step = verifyTotp(user.twoFactorTempSecret, code);
            if (step == null) throw new Error('That code did not match. Enter the newest 6-digit code from the app.');
            user.twoFactorSecret = user.twoFactorTempSecret;
            user.twoFactorTempSecret = undefined;
            user.twoFactorLastStep = step;
            user.twoFactorEnabled = true;
            await user.save();
            return NextResponse.json({ success: true, enabled: true, message: 'Authenticator app connected' }, { status: 200 });
        }

        if (action === 'disable') {
            if (!user.twoFactorEnabled) {
                return NextResponse.json({ success: true, enabled: false, message: 'Authenticator app is already off' }, { status: 200 });
            }
            // The app code, or the account password for someone who lost the phone.
            let allowed = false;
            if (code) {
                const step = verifyTotp(user.twoFactorSecret, code, user.twoFactorLastStep);
                if (step != null) allowed = true;
            }
            if (!allowed && password) {
                const withPassword = await userModel.findById(user._id);
                allowed = await withPassword.comparePass(password);
            }
            if (!allowed) throw new Error('Enter a current code from the app, or your password.');
            user.twoFactorEnabled = false;
            user.twoFactorSecret = undefined;
            user.twoFactorTempSecret = undefined;
            user.twoFactorLastStep = undefined;
            await user.save();
            return NextResponse.json({ success: true, enabled: false, message: 'Authenticator app removed' }, { status: 200 });
        }

        throw new Error('unknown action');
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
}));
