import userModel from "@/models/user";

// Albums synced in from HGC Radio must land on the station admin account — the
// same account every DJ points at through `djOwner` — otherwise the playlist is
// owned by someone no DJ is attached to and stays invisible in the DJ panel.
//
// A bare findOne({isDJ: false}) is not safe here: /api/v1/register is public and
// creates isDJ:false accounts, so it can return an unrelated station.
export async function findStationOwner() {
    if (process.env.HGDJ_OWNER_ID) {
        const pinned = await userModel.findById(process.env.HGDJ_OWNER_ID);
        if (pinned) return pinned;
    }

    // The account the DJs actually belong to is by definition the right owner.
    const dj = await userModel
        .findOne({ isDJ: true, djOwner: { $exists: true, $ne: null } })
        .sort({ createdAt: 1 })
        .select("djOwner");

    if (dj?.djOwner) {
        const owner = await userModel.findById(dj.djOwner);
        if (owner) return owner;
    }

    // No DJs created yet — fall back to the oldest non-DJ account.
    return userModel.findOne({ isDJ: false }).sort({ createdAt: 1 });
}
