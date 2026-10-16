import connectDB from "@/db/connectDB";
import { NextResponse } from "next/server";
import userModel from "@/models/user";
import { utcDayShift } from "@/utils/djTime";

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

const DAY_INDEX = Object.fromEntries(Object.entries(DAY_NAMES).map(([i, name]) => [name, Number(i)]));

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

            // startTime/endTime are UTC (what the website and app expect).
            // This used to send rawTime first: the time as typed, in the DJ's
            // zone, which the site then read as UTC and shifted by hours.
            // Days were picked for the typed time, so move them by however many
            // days the UTC start lands from it (Mon 8 PM New York = Tue 00:00 UTC).
            const shift = utcDayShift(dj.rawTime?.split("|")[0], dj.djStartTime);
            if (shift) {
                days = days.map((day) => DAY_NAMES[String((DAY_INDEX[day] + shift + 7) % 7)]);
            }

            const entry = {
                name:          dj.name,
                profilePicUrl: dj.djProfilePic ? `${socketBase}${dj.djProfilePic}` : null,
                startTime:     dj.djStartTime || null,
                endTime:       dj.djEndTime   || null,
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
