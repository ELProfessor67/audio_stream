import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { auth } from "@/middleswares/auth";
import axios from "axios";


export const POST = connectDB(auth(async function (req) {
    try {
        const { name, email, password, permissions, starttime, endtime, djDate, djTimeInDays, djDays, rawTime, timezone, phone, profilePicBase64, profilePicExt } = await req.json();

        if (!name || !email || !password || !permissions || permissions?.length == 0)
            return NextResponse.json({ success: false, message: 'all fields are required' }, { status: 401 });

        const emailExist = await userModel.findOne({ email });
        if (emailExist) {
            return NextResponse.json({ success: false, message: 'email already exists' }, { status: 409 });
        }

        const owner = req.user;

        // Upload profile picture if provided (non-blocking — failure does NOT prevent DJ creation)
        let djProfilePic = undefined;
        let profilePicWarning = undefined;
        if (profilePicBase64 && profilePicExt) {
            const safeName = name.replaceAll(' ', '_');
            const picFileName = `dj-${safeName}-${Date.now()}.${profilePicExt}`;
            try {
                await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`, {
                    filename: `/upload/cover/${picFileName}`,
                    base64: profilePicBase64
                });
                djProfilePic = `/upload/cover/${picFileName}`;
            } catch (err) {
                // Log but continue — DJ is created without a profile picture
                console.error('Profile picture upload failed (non-fatal):', err?.response?.data?.message || err.message);
                profilePicWarning = `Profile picture could not be uploaded and was skipped. You can add it later.`;
            }
        }

        const userData = {
            name, email, password,
            country: owner.country,
            station_name: owner.station_name,
            website_url: owner.website_url,
            timezone: timezone || owner.timezone,
            isDJ: true,
            djOwner: owner._id,
            djPermissions: permissions,
            isSubscriber: owner.isSubscriber,
            djStartTime: starttime,
            djEndTime: endtime,
            djDate, djTimeInDays, djDays, rawTime,
            phone,
            djProfilePic
        };

        const user = await userModel.create(userData);
        return NextResponse.json({ success: true, message: 'DJ added successfully', dj: user, warning: profilePicWarning });

    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));


export const GET = connectDB(auth(async function (req) {
    try {
        const teams = await userModel.find({ djOwner: req.user._id });
        return NextResponse.json({ success: true, teams });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 501 });
    }
}));


export const DELETE = connectDB(auth(async function (req) {
    try {
        const params = new URLSearchParams(req.url.split('?')[1]);
        const id = params.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'id is required' }, { status: 401 });

        // Also delete profile pic from socket server if exists
        const dj = await userModel.findById(id);
        if (dj?.djProfilePic) {
            try {
                await axios.delete(`${process.env.NEXT_PUBLIC_SOCKET_URL}/delete?id=${dj.djProfilePic}`);
            } catch (_) { /* ignore if file not found */ }
        }

        await userModel.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));