
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import songModel from "@/models/song";
import mongoose from "mongoose";
import axios from "axios";
import { isAbsoluteUrl, resolveMedia, withResolvedMedia } from "@/utils/mediaUrl";
import { findStationOwner } from "@/utils/stationOwner";

const DEFAULT_COVER = "/upload/cover/default.jpg";

// POST /api/v1/noauth/playlist
// No auth required. Creates a playlist with a custom _id, or updates it if it
// already exists, so re-approving an album on HGC Radio stays idempotent.
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
//   cover       : string  — base64, remote http(s) URL, or existing path (optional)
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

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return NextResponse.json({ success: false, message: `_id '${_id}' is not a valid ObjectId` }, { status: 400 });
        }

        // ── Find the station admin account that DJs are attached to ──────────
        const ownerUser = await findStationOwner();
        if (!ownerUser) {
            return NextResponse.json({ success: false, message: "Owner user not found" }, { status: 404 });
        }

        // ── Resolve cover: remote URLs are stored as-is, base64 gets uploaded ──
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
        let coverPath = DEFAULT_COVER;

        if (cover && isAbsoluteUrl(cover)) {
            coverPath = cover;
        } else if (cover) {
            const titleSlug = title.replaceAll(" ", "");
            const coverFileName = `${titleSlug}-${Date.now()}.${coverEx || "jpg"}`;
            try {
                await axios.post(`${SOCKET_URL}/upload`, {
                    filename: `/upload/cover/${coverFileName}`,
                    base64: cover,
                });
                coverPath = `/upload/cover/${coverFileName}`;
            } catch (err) {
                // A missing cover must not block the album from reaching the DJ panel.
                console.error("[noauth/playlist] cover upload failed:", err?.message);
            }
        }

        // ── Validate song ids if provided ─────────────────────────────────────
        let songIds = [];
        if (songs && Array.isArray(songs) && songs.length > 0) {
            const foundSongs = await songModel.find({ _id: { $in: songs } });
            songIds = foundSongs.map((s) => s._id);
        }

        // ── Update in place when the playlist already exists ──────────────────
        const existingPlaylist = await playlistModel.findById(_id);
        if (existingPlaylist) {
            existingPlaylist.title = title;
            existingPlaylist.description = description;
            existingPlaylist.owner = ownerUser._id;
            existingPlaylist.isTemp = isTemp === true;
            if (artist) existingPlaylist.artist = artist;
            if (album) existingPlaylist.album = album;
            if (cover) existingPlaylist.cover = coverPath;

            // Keep tracks that were already attached to the playlist.
            const merged = new Set(existingPlaylist.songs.map((id) => String(id)));
            songIds.forEach((id) => merged.add(String(id)));
            existingPlaylist.songs = [...merged].map((id) => new mongoose.Types.ObjectId(id));

            await existingPlaylist.save();

            const updated = JSON.parse(JSON.stringify(existingPlaylist));
            updated.cover = resolveMedia(updated.cover);

            return NextResponse.json({ success: true, message: "Playlist updated successfully", playlist: updated });
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
            cover: coverPath,
        });
        await playlistDoc.save();

        const playlist = JSON.parse(JSON.stringify(playlistDoc));
        playlist.cover = resolveMedia(playlist.cover);

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
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: "Playlist not found" }, { status: 404 });
        }

        let playlist = await playlistModel.findById(id).populate("owner").populate("songs");
        if (!playlist) return NextResponse.json({ success: false, message: "Playlist not found" }, { status: 404 });

        playlist = JSON.parse(JSON.stringify(playlist));
        playlist.cover = resolveMedia(playlist.cover);
        playlist.songs = playlist.songs.map(withResolvedMedia);

        return NextResponse.json({ success: true, playlist });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});
