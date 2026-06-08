
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import songModel from "@/models/song";
import userModel from "@/models/user";
import mongoose from "mongoose";
import axios from "axios";

// POST /api/v1/noauth/playlist
// No auth required. Creates a playlist with a custom _id if it doesn't exist.
// The playlist is created under the isOwner (isDJ: false) user's account.
//
// Body:
// {
//   _id         : string  — custom playlist ObjectId  (required)
//   title       : string  (required)
//   description : string  (required)
//   songs       : string[] — array of song ObjectIds to include (optional)
//   artist      : string  (optional)
//   album       : string  (optional)
//   cover       : string  — base64 or existing URL (optional)
//   coverEx     : string  — file extension e.g. "jpg" (required if cover is base64)
//   isTemp      : boolean (optional, default false)
// }
export const POST = connectDB(async function (req) {
    try {
        let {
            _id,
            title,
            description,
            songs,
            artist,
            album,
            cover,
            coverEx,
            isTemp,
        } = await req.json();

        // ── Validate required fields ──────────────────────────────────────────
        if (!_id)         return NextResponse.json({ success: false, message: "_id is required" }, { status: 400 });
        if (!title)       return NextResponse.json({ success: false, message: "title is required" }, { status: 400 });
        if (!description) return NextResponse.json({ success: false, message: "description is required" }, { status: 400 });

        // ── Find the owner (isOwner = isDJ: false, main account) ─────────────
        const ownerUser = await userModel.findOne({ isDJ: false });
        if (!ownerUser) {
            return NextResponse.json({ success: false, message: "Owner user not found" }, { status: 404 });
        }

        // ── Check if playlist with this _id already exists ────────────────────
        const existingPlaylist = await playlistModel.findById(_id);
        if (existingPlaylist) {
            return NextResponse.json({
                success: false,
                message: `Playlist with _id '${_id}' already exists`,
                playlist: existingPlaylist,
            }, { status: 409 });
        }

        // ── Upload cover if provided ──────────────────────────────────────────
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
        let coverFileName = "default.jpg";

        if (cover) {
            const titleSlug = title.replaceAll(" ", "");
            coverFileName = `${titleSlug}-${Date.now()}.${coverEx}`;
            try {
                await axios.post(`${SOCKET_URL}/upload`, {
                    filename: `/upload/cover/${coverFileName}`,
                    base64: cover,
                });
            } catch (err) {
                return NextResponse.json({ success: false, message: err?.response?.data?.message || "Cover upload failed" }, { status: 502 });
            }
        }

        // ── Validate song ids if provided ─────────────────────────────────────
        let songIds = [];
        if (songs && Array.isArray(songs) && songs.length > 0) {
            const foundSongs = await songModel.find({ _id: { $in: songs } });
            songIds = foundSongs.map((s) => s._id);
        }

        // ── Create playlist with custom _id ───────────────────────────────────
        const playlistDoc = new playlistModel({
            _id: new mongoose.Types.ObjectId(_id),
            title,
            description,
            songs: songIds,
            owner: ownerUser._id,
            isTemp: isTemp === true,
            artist,
            album,
            cover: `/upload/cover/${coverFileName}`,
        });
        await playlistDoc.save();

        const playlist = JSON.parse(JSON.stringify(playlistDoc));
        playlist.cover = `${SOCKET_URL}${playlist.cover}`;

        return NextResponse.json({ success: true, message: "Playlist created successfully", playlist });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});


// GET /api/v1/noauth/playlist?id=<playlistId>
// Returns a single playlist (with populated songs) without auth.
export const GET = connectDB(async function (req) {
    try {
        const params = new URLSearchParams(req.url.split("?")[1]);
        const id = params.get("id");
        if (!id) return NextResponse.json({ success: false, message: "id query param is required" }, { status: 400 });

        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

        let playlist = await playlistModel.findById(id).populate("owner").populate("songs");
        if (!playlist) return NextResponse.json({ success: false, message: "Playlist not found" }, { status: 404 });

        playlist = JSON.parse(JSON.stringify(playlist));
        playlist.cover = `${SOCKET_URL}${playlist.cover}`;
        playlist.songs = playlist.songs.map((song) => ({
            ...song,
            audio: `${SOCKET_URL}${song.audio}`,
            cover: `${SOCKET_URL}${song.cover}`,
        }));

        return NextResponse.json({ success: true, playlist });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});
