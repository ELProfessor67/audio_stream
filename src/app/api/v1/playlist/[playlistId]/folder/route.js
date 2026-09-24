
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";
import { uploadCover, DEFAULT_COVER } from "@/utils/coverUpload";
import { claimFromSiblings, mergeIntoPlaylist } from "@/utils/playlistFolders";

// /api/v1/playlist/<playlistId>/folder
const playlistIdFromUrl = (url) => url.split("?")[0].split("/")[6];

const toIdList = (songs) => (Array.isArray(songs) ? songs.map(String) : []);

export const POST = connectDB(auth(async function (req) {
    try {
        const { name, cover, coverEx, songs } = await req.json();
        if (!name) return NextResponse.json({ success: false, message: "folder name is required" }, { status: 400 });

        const playlist = await playlistModel.findById(playlistIdFromUrl(req.url));
        if (!playlist) return NextResponse.json({ success: false, message: "playlist not found" }, { status: 404 });

        let coverPath = DEFAULT_COVER;
        try {
            coverPath = (await uploadCover(cover, name, coverEx)) || DEFAULT_COVER;
        } catch (err) {
            return NextResponse.json({ success: false, message: err?.response?.data || err.message }, { status: 502 });
        }

        const songIds = toIdList(songs);
        mergeIntoPlaylist(playlist, songIds);
        claimFromSiblings(playlist, songIds, null);
        playlist.folders.push({ name, cover: coverPath, songs: songIds });
        await playlist.save();

        return NextResponse.json({ success: true, message: "folder created successfully" });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));

export const PUT = connectDB(auth(async function (req) {
    try {
        const { folderId, name, cover, coverEx, songs } = await req.json();
        if (!folderId) return NextResponse.json({ success: false, message: "folderId is required" }, { status: 400 });

        const playlist = await playlistModel.findById(playlistIdFromUrl(req.url));
        if (!playlist) return NextResponse.json({ success: false, message: "playlist not found" }, { status: 404 });

        const folder = playlist.folders.id(folderId);
        if (!folder) return NextResponse.json({ success: false, message: "folder not found" }, { status: 404 });

        if (name) folder.name = name;

        if (cover) {
            try {
                folder.cover = (await uploadCover(cover, name || folder.name, coverEx)) || folder.cover;
            } catch (err) {
                return NextResponse.json({ success: false, message: err?.response?.data || err.message }, { status: 502 });
            }
        }

        if (songs !== undefined) {
            const songIds = toIdList(songs);
            folder.songs = songIds;
            mergeIntoPlaylist(playlist, songIds);
            claimFromSiblings(playlist, songIds, folder._id);
        }

        await playlist.save();
        return NextResponse.json({ success: true, message: "folder updated successfully" });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));

// Removing a folder keeps its tracks in the playlist by default; they simply
// move back up to the playlist root. `removeSongs=true` drops them entirely.
export const DELETE = connectDB(auth(async function (req) {
    try {
        const params = new URLSearchParams(req.url.split("?")[1]);
        const folderId = params.get("folderId");
        const removeSongs = params.get("removeSongs") === "true";
        if (!folderId) return NextResponse.json({ success: false, message: "folderId is required" }, { status: 400 });

        const playlist = await playlistModel.findById(playlistIdFromUrl(req.url));
        if (!playlist) return NextResponse.json({ success: false, message: "playlist not found" }, { status: 404 });

        const folder = playlist.folders.id(folderId);
        if (!folder) return NextResponse.json({ success: false, message: "folder not found" }, { status: 404 });

        if (removeSongs) {
            const dropped = new Set(folder.songs.map(String));
            playlist.songs = playlist.songs.filter((id) => !dropped.has(String(id)));
        }

        playlist.folders.pull(folderId);
        await playlist.save();

        return NextResponse.json({ success: true, message: "folder deleted successfully" });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));
