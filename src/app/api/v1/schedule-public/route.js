import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";

// CORS — allow any external website
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const DAY_NAMES = {
    "0": "Sunday",
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday",
};

// ---------------------------------------------------------------------------
// GET /api/v1/schedule-public
//
// No parameters needed — returns ALL DJs grouped by day,
// ready to render the Daily Programs Schedule UI:
// {
//   "Sunday":    [ { name, profilePicUrl, startTime, endTime, timezone } ],
//   "Monday":    [ ... ],
//   ...
// }
// ---------------------------------------------------------------------------
export const GET = connectDB(async function (req) {
    try {
        // Fetch every DJ across all owners
        const djs = await userModel
            .find({ isDJ: true })
            .select("name djProfilePic djStartTime djEndTime djDate djTimeInDays djDays rawTime timezone djEventName");

        const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL || "";

        const schedule = {
            Sunday:    [],
            Monday:    [],
            Tuesday:   [],
            Wednesday: [],
            Thursday:  [],
            Friday:    [],
            Saturday:  [],
        };

        djs.forEach((dj) => {
            // Build the days list for this DJ
            let days = [];
            if (dj.djTimeInDays && dj.djDays?.length > 0) {
                // Repeating weekly days e.g. ["Monday", "Wednesday", "Friday"]
                days = dj.djDays
                    .map((num) => DAY_NAMES[String(num)])
                    .filter(Boolean);
            } else if (dj.djDate) {
                // One-off date → derive weekday name
                const d = new Date(dj.djDate);
                if (!isNaN(d)) days = [DAY_NAMES[String(d.getDay())]];
            }

            const entry = {
                name:          dj.name,
                profilePicUrl: dj.djProfilePic ? `${socketBase}${dj.djProfilePic}` : null,
                startTime:     dj.rawTime?.split("|")[0] || dj.djStartTime || null,
                endTime:       dj.rawTime?.split("|")[1] || dj.djEndTime   || null,
                timezone:      dj.timezone || null,
                eventName:     dj.djEventName || `${dj.name} special`,
                days,                           // ← which days this DJ appears
            };

            // Push into each day bucket
            days.forEach((day) => {
                if (schedule[day]) schedule[day].push(entry);
            });
        });

        // Sort each day's list by start time ascending
        Object.values(schedule).forEach((list) =>
            list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
        );

        return NextResponse.json(schedule, { status: 200, headers: CORS_HEADERS });

    } catch (err) {
        return NextResponse.json(
            { success: false, message: err.message },
            { status: 500, headers: CORS_HEADERS }
        );
    }
});
