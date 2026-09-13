import userModel from "@/models/user";
import playlistModel from "@/models/playlist";

// Albums synced in from HGC Radio must land on the station admin account — the
// one whose library the DJ panel actually renders. Land them anywhere else and
// the playlist exists in the database but shows up for nobody.
//
// A bare findOne({isDJ: false}) is not safe: /api/v1/register is public, so there
// are several isDJ:false accounts and the query can return an unrelated station.
export async function findStationOwner() {
    if (process.env.HGDJ_OWNER_ID) {
        const pinned = await userModel.findById(process.env.HGDJ_OWNER_ID);
        if (pinned) return pinned;
    }

    // The account that already owns the bulk of the library is the real station
    // admin. This keeps synced albums in the same library the admin sees, and
    // self-corrects if an earlier sync picked the wrong account.
    const topOwners = await playlistModel.aggregate([
        { $match: { isTemp: { $ne: true } } },
        { $group: { _id: "$owner", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
    ]);

    for (const row of topOwners) {
        if (!row?._id) continue;
        const owner = await userModel.findById(row._id);
        if (owner && !owner.isDJ) return owner;
    }

    // Nothing in the library yet — fall back to the account DJs are attached to.
    const dj = await userModel
        .findOne({ isDJ: true, djOwner: { $exists: true, $ne: null } })
        .sort({ createdAt: 1 })
        .select("djOwner");

    if (dj?.djOwner) {
        const owner = await userModel.findById(dj.djOwner);
        if (owner) return owner;
    }

    return userModel.findOne({ isDJ: false }).sort({ createdAt: 1 });
}
