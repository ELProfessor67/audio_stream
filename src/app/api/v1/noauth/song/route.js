
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import playlistModel from "@/models/playlist";
import mongoose from "mongoose";
import axios from "axios";
import { isAbsoluteUrl, resolveMedia } from "@/utils/mediaUrl";
import { findStationOwner } from "@/utils/stationOwner";

const DEFAULT_COVER = "/upload/cover/default.jpg";

// Attaches a song to a playlist without creating duplicate entries.
async function attachToPlaylist(playlistId, songId) {
    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) return;
    const playlist = await playlistModel.findById(playlistId);
    if (!playlist) return;
    if (playlist.songs.some((id) => String(id) === String(songId))) return;
    playlist.songs.push(songId);
    await playlist.save();
}

// POST /api/v1/noauth/song
// No auth required. Adds a song with a custom _id under the isOwner
// (isDJ: false) account, then attaches it to the given playlist.
// Re-posting an existing song is idempotent: it only re-attaches the song.
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

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return NextResponse.json({ success: false, message: `_id '${_id}' is not a valid ObjectId` }, { status: 400 });
        }

        // ── Find the station admin account that DJs are attached to ──────────
        const ownerUser = await findStationOwner();
        if (!ownerUser) {
            return NextResponse.json({ success: false, message: "Owner user not found" }, { status: 404 });
        }

        // ── Already synced: just make sure it is on the playlist ──────────────
        const existing = await songModel.findById(_id);
        if (existing) {
            await attachToPlaylist(playlistId, existing._id);
            const song = JSON.parse(JSON.stringify(existing));
            song.cover = resolveMedia(song.cover);
            song.audio = resolveMedia(song.audio);
            return NextResponse.json({ success: true, message: "Song already exists", song });
        }

        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

        // ── Resolve cover: remote URLs are stored as-is, base64 gets uploaded ──
        let coverPath = DEFAULT_COVER;

        if (cover && isAbsoluteUrl(cover)) {
            coverPath = cover;
        } else if (cover && !cover.includes(DEFAULT_COVER)) {
            const title2 = title.replaceAll(" ", "").replaceAll("mp3", "");
            const coverFileName = `${title2}-${Date.now()}.${coverEx || "jpg"}`;
            try {
                await axios.post(`${SOCKET_URL}/upload`, {
                    filename: `/upload/cover/${coverFileName}`,
                    base64: cover,
                });
                coverPath = `/upload/cover/${coverFileName}`;
            } catch (err) {
                // A missing cover must not block the track from reaching the DJ panel.
                console.error("[noauth/song] cover upload failed:", err?.message);
            }
        }

        // ── Resolve audio: remote URLs are stored as-is, base64 gets uploaded ──
        let audioPath;

        if (isAbsoluteUrl(audio)) {
            audioPath = audio;
        } else {
            const title2 = title.replaceAll(" ", "").replaceAll("mp3", "");
            const audioFileName = `${title2}-${Date.now()}.${audioEx || "mp3"}`;
            try {
                await axios.post(`${SOCKET_URL}/upload`, {
                    filename: `/upload/songs/${audioFileName}`,
                    base64: audio,
                });
            } catch (err) {
                return NextResponse.json({ success: false, message: err?.response?.data?.message || "Audio upload failed" }, { status: 502 });
            }
            audioPath = `/upload/songs/${audioFileName}`;
        }

        // ── Create song with custom _id ───────────────────────────────────────
        const songDoc = new songModel({
            _id: new mongoose.Types.ObjectId(_id),
            title,
            description,
            artist: artist || "Unknown",
            size: size || 0,
            type: type || "audio/mpeg",
            audio: audioPath,
            cover: coverPath,
            owner: ownerUser._id,
            duration,
            album,
        });
        await songDoc.save();

        await attachToPlaylist(playlistId, songDoc._id);

        // ── Build response with full URLs ─────────────────────────────────────
        const song = JSON.parse(JSON.stringify(songDoc));
        song.cover = resolveMedia(song.cover);
        song.audio = resolveMedia(song.audio);

        return NextResponse.json({ success: true, message: "Song added successfully", song });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});
