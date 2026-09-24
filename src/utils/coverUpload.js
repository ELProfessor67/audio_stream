import axios from "axios";
import { isAbsoluteUrl } from "./mediaUrl";

export const DEFAULT_COVER = "/upload/cover/default.jpg";

// Covers live on the media server, not in this app. Anything already absolute
// (synced in from HGC Radio) or already a stored path is passed straight
// through; only fresh base64 payloads get uploaded.
export const uploadCover = async (cover, nameHint = "cover", ext = "jpg") => {
    if (!cover) return null;
    if (isAbsoluteUrl(cover)) return cover;
    if (!cover.startsWith("data:")) return cover;

    const slug = String(nameHint).replaceAll(" ", "").replace(/[^a-zA-Z0-9-_]/g, "") || "cover";
    const filename = `/upload/cover/${slug}-${Date.now()}.${ext || "jpg"}`;

    await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/upload`, {
        filename,
        base64: cover,
    });

    return filename;
};
