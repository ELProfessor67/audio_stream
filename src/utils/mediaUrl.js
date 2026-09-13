// Locally uploaded media is stored as a host-relative path ("/upload/songs/x.mp3")
// and needs the media host prefixed. Media synced in from HGC Radio is already a
// full remote URL and must be returned untouched, otherwise it gets prefixed twice
// and the track fails to load in the DJ panel and Go Live.

export const isAbsoluteUrl = (value) =>
    typeof value === 'string' && /^https?:\/\//i.test(value);

export const resolveMedia = (value) => {
    if (!value) return value;
    if (isAbsoluteUrl(value)) return value;
    return `${process.env.NEXT_PUBLIC_SOCKET_URL}${value}`;
};

export const withResolvedMedia = (song) => ({
    ...song,
    audio: resolveMedia(song?.audio),
    cover: resolveMedia(song?.cover),
});
