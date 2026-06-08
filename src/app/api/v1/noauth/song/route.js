
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import playlistModel from "@/models/playlist";
import userModel from "@/models/user";
import mongoose from "mongoose";
import axios from "axios";

// POST /api/v1/noauth/song
// No auth required. Adds a song with a custom _id.
// The song is added to the isOwner (isDJ: false) user's account.
// Body: { _id, title, description, artist, size, type, audio, cover, audioEx, coverEx, duration, album, playlistId }
export const POST = connectDB(async function (req) {
    try {
        let {
            _id,
            title,
            description,
            artist,
            size,
            type,
            audio,
            cover,
            audioEx,
            coverEx,
            duration,
            album,
            playlistId,   // optional: add song to this playlist _id after creation
        } = await req.json();

        // ── Validate required fields ──────────────────────────────────────────
        if (!_id)    return NextResponse.json({ success: false, message: "_id is required" }, { status: 400 });
        if (!title)  return NextResponse.json({ success: false, message: "title is required" }, { status: 400 });
        if (!audio)  return NextResponse.json({ success: false, message: "audio is required" }, { status: 400 });
        if (!cover)  return NextResponse.json({ success: false, message: "cover is required" }, { status: 400 });
        if (!size)   return NextResponse.json({ success: false, message: "size is required" }, { status: 400 });
        if (!type)   return NextResponse.json({ success: false, message: "type is required" }, { status: 400 });

        // ── Find the owner (isOwner = isDJ: false, main account) ─────────────
        const ownerUser = await userModel.findOne({ isDJ: false });
        if (!ownerUser) {
            return NextResponse.json({ success: false, message: "Owner user not found" }, { status: 404 });
        }

        // ── Check duplicate _id ───────────────────────────────────────────────
        const existing = await songModel.findById(_id);
        if (existing) {
            return NextResponse.json({ success: false, message: `Song with _id '${_id}' already exists` }, { status: 409 });
        }

        // ── Upload cover ──────────────────────────────────────────────────────
        let coverFileName;
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

        if (cover.includes("/upload/cover/default.jpg")) {
            coverFileName = "default.jpg";
        } else {
            const title2 = title.replaceAll(" ", "").replaceAll("mp3", "");
            coverFileName = `${title2}-${Date.now()}.${coverEx}`;
            try {
                await axios.post(`${SOCKET_URL}/upload`, {
                    filename: `/upload/cover/${coverFileName}`,
                    base64: cover,
                });
            } catch (err) {
                return NextResponse.json({ success: false, message: err?.response?.data?.message || "Cover upload failed" }, { status: 502 });
            }
        }

        // ── Upload audio ──────────────────────────────────────────────────────
        const title2 = title.replaceAll(" ", "").replaceAll("mp3", "");
        const audioFileName = `${title2}-${Date.now()}.${audioEx}`;
        try {
            await axios.post(`${SOCKET_URL}/upload`, {
                filename: `/upload/songs/${audioFileName}`,
                base64: audio,
            });
        } catch (err) {
            return NextResponse.json({ success: false, message: err?.response?.data?.message || "Audio upload failed" }, { status: 502 });
        }

        // ── Create song with custom _id ───────────────────────────────────────
        const songDoc = new songModel({
            _id: new mongoose.Types.ObjectId(_id),
            title,
            description,
            artist: artist || "Unknown",
            size,
            type,
            audio: `/upload/songs/${audioFileName}`,
            cover: `/upload/cover/${coverFileName}`,
            owner: ownerUser._id,
            duration,
            album,
        });
        await songDoc.save();

        // ── Optionally add to playlist ────────────────────────────────────────
        if (playlistId) {
            const playlist = await playlistModel.findById(playlistId);
            if (playlist) {
                playlist.songs.push(songDoc._id);
                await playlist.save();
            }
        }

        // ── Build response with full URLs ─────────────────────────────────────
        const song = JSON.parse(JSON.stringify(songDoc));
        song.cover = `${SOCKET_URL}${song.cover}`;
        song.audio = `${SOCKET_URL}${song.audio}`;

        return NextResponse.json({ success: true, message: "Song added successfully", song });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});
