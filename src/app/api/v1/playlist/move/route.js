
import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import playlistModel from "@/models/playlist";
import { auth } from "@/middleswares/auth";
import { applyFolderMove, applySongMove, sameId } from "@/utils/playlistFolders";

// Moving a track or a folder rewrites two playlists at once. Doing it here
// avoids round-tripping folder documents through the client, where covers have
// already been rewritten into absolute media URLs.

const moveSong = async ({ songId, sourcePlaylistId, targetPlaylistId, targetFolderId }) => {
    if (!songId || !sourcePlaylistId || !targetPlaylistId) {
        return { status: 400, message: "songId, sourcePlaylistId and targetPlaylistId are required" };
    }

    const crossPlaylist = !sameId(sourcePlaylistId, targetPlaylistId);

    const source = await playlistModel.findById(sourcePlaylistId);
    if (!source) return { status: 404, message: "source playlist not found" };

    const target = crossPlaylist ? await playlistModel.findById(targetPlaylistId) : source;
    if (!target) return { status: 404, message: "target playlist not found" };

    const failure = applySongMove({ source, target, songId, targetFolderId });
    if (failure) return failure;

    await source.save();
    if (crossPlaylist) await target.save();

    return { status: 200, message: "song moved successfully" };
};

const moveFolder = async ({ folderId, sourcePlaylistId, targetPlaylistId }) => {
    if (!folderId || !sourcePlaylistId || !targetPlaylistId) {
        return { status: 400, message: "folderId, sourcePlaylistId and targetPlaylistId are required" };
    }
    if (sameId(sourcePlaylistId, targetPlaylistId)) return { status: 200, message: "folder already here" };

    const source = await playlistModel.findById(sourcePlaylistId);
    if (!source) return { status: 404, message: "source playlist not found" };

    const target = await playlistModel.findById(targetPlaylistId);
    if (!target) return { status: 404, message: "target playlist not found" };

    const failure = applyFolderMove({ source, target, folderId });
    if (failure) return failure;

    await Promise.all([source.save(), target.save()]);

    return { status: 200, message: "folder moved successfully" };
};

export const POST = connectDB(auth(async function (req) {
    try {
        const body = await req.json();
        const result = body?.type === "folder" ? await moveFolder(body) : await moveSong(body);

        return NextResponse.json(
            { success: result.status === 200, message: result.message },
            { status: result.status },
        );
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 501 });
    }
}));
