
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import songModel from "@/models/song";
import playlistModel from "@/models/playlist";
import autoDJListModel from "@/models/autoDJList";
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
// No auth required. Upserts a song with a custom _id under the station admin
// account, then attaches it to the given playlist. Re-posting an existing song
// updates its metadata, so edits made after album approval propagate here.
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

        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
        const existing = await songModel.findById(_id);
        const slug = title.replaceAll(" ", "").replaceAll("mp3", "");

        // Absolute URLs (album media on Cloudinary) are stored as-is. Base64
        // payloads get uploaded to the media host, but are never re-uploaded for
        // a song that already exists — that file is already on the host.
        let coverPath = existing?.cover || DEFAULT_COVER;

        if (cover && isAbsoluteUrl(cover)) {
            coverPath = cover;
        } else if (cover && !existing && !cover.includes(DEFAULT_COVER)) {
            const coverFileName = `${slug}-${Date.now()}.${coverEx || "jpg"}`;
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

        let audioPath = existing?.audio;

        if (isAbsoluteUrl(audio)) {
            audioPath = audio;
        } else if (!existing) {
            const audioFileName = `${slug}-${Date.now()}.${audioEx || "mp3"}`;
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

        // ── Update in place when the song already exists ──────────────────────
        if (existing) {
            existing.title = title;
            existing.artist = artist || existing.artist || "Unknown";
            existing.audio = audioPath;
            existing.cover = coverPath;
            existing.owner = ownerUser._id;
            if (description !== undefined) existing.description = description;
            if (size) existing.size = size;
            if (type) existing.type = type;
            if (duration !== undefined) existing.duration = duration;
            if (album !== undefined) existing.album = album;
            await existing.save();

            await attachToPlaylist(playlistId, existing._id);

            const updated = JSON.parse(JSON.stringify(existing));
            updated.cover = resolveMedia(updated.cover);
            updated.audio = resolveMedia(updated.audio);

            return NextResponse.json({ success: true, message: "Song updated successfully", song: updated });
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


// DELETE /api/v1/noauth/song?_id=<songId>
// Removes a synced song and detaches it from every playlist and Auto DJ list,
// so deleting an album track on HGC Radio also clears it from the DJ panel.
export const DELETE = connectDB(async function (req) {
    try {
        const params = new URLSearchParams(req.url.split("?")[1]);
        const id = params.get("_id") || params.get("id");

        if (!id) return NextResponse.json({ success: false, message: "_id query param is required" }, { status: 400 });
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: "Song not found" }, { status: 404 });
        }

        const song = await songModel.findById(id);
        // Already absent is the desired end state, so report success.
        if (!song) {
            return NextResponse.json({ success: true, message: "Song already removed" });
        }

        await playlistModel.updateMany({ songs: song._id }, { $pull: { songs: song._id } });
        await autoDJListModel.updateMany(
            { "songs.data": song._id },
            { $pull: { songs: { data: song._id } } }
        );

        // Only media uploaded to our own host can be deleted; remote album URLs
        // belong to HGC Radio's storage.
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
        for (const path of [song.audio, song.cover]) {
            if (!path || isAbsoluteUrl(path) || path === DEFAULT_COVER) continue;
            try {
                await axios.delete(`${SOCKET_URL}/delete?id=${path}`);
            } catch (err) {
                console.error("[noauth/song] media delete failed:", err?.message);
            }
        }

        await songModel.findByIdAndDelete(song._id);

        return NextResponse.json({ success: true, message: "Song removed" });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});
