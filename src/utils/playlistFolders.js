// Mutations that keep a playlist's flat `songs` list and its folder grouping in
// agreement. They operate on mongoose documents in memory; callers save.
//
// Two invariants hold everywhere:
//   1. `playlist.songs` lists every track in the playlist, grouped or not. It is
//      what the Go Live queue, Auto DJ and schedules read, so it must stay whole.
//   2. A track belongs to at most one folder of a given playlist.

export const sameId = (a, b) => String(a) === String(b);

export const detachFromFolders = (playlist, songId) => {
    playlist.folders.forEach((folder) => {
        folder.songs = folder.songs.filter((id) => !sameId(id, songId));
    });
};

export const mergeIntoPlaylist = (playlist, songIds) => {
    const existing = new Set(playlist.songs.map(String));
    songIds.forEach((id) => {
        if (!existing.has(String(id))) {
            existing.add(String(id));
            playlist.songs.push(id);
        }
    });
};

export const claimFromSiblings = (playlist, songIds, keepFolderId) => {
    const claimed = new Set(songIds.map(String));
    playlist.folders.forEach((folder) => {
        if (keepFolderId && sameId(folder._id, keepFolderId)) return;
        folder.songs = folder.songs.filter((id) => !claimed.has(String(id)));
    });
};

// Returns null on success, or an error describing why the move is impossible.
export const applySongMove = ({ source, target, songId, targetFolderId }) => {
    const crossPlaylist = source !== target;

    detachFromFolders(source, songId);
    if (crossPlaylist) {
        source.songs = source.songs.filter((id) => !sameId(id, songId));
        detachFromFolders(target, songId);
    }

    if (!target.songs.some((id) => sameId(id, songId))) target.songs.push(songId);

    if (targetFolderId) {
        const folder = target.folders.id(targetFolderId);
        if (!folder) return { status: 404, message: "target folder not found" };
        if (!folder.songs.some((id) => sameId(id, songId))) folder.songs.push(songId);
    }

    return null;
};

export const applyFolderMove = ({ source, target, folderId }) => {
    const folder = source.folders.id(folderId);
    if (!folder) return { status: 404, message: "folder not found" };

    const moving = folder.songs.map(String);

    target.folders.push({ name: folder.name, cover: folder.cover, songs: moving });
    mergeIntoPlaylist(target, moving);

    const movingSet = new Set(moving);
    source.songs = source.songs.filter((id) => !movingSet.has(String(id)));
    source.folders.pull(folderId);

    return null;
};
