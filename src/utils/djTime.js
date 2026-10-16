// DJ slot times. A slot is typed as a wall clock in the DJ's timezone and
// stored twice on the user: rawTime ("HH:mm|HH:mm", as typed) and
// djStartTime / djEndTime (UTC "HH:mm").

const MINUTES_PER_DAY = 24 * 60;

const toMinutes = (time) => {
    const [h, m] = (time || '').split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const toTime = (minutes) => {
    const m = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// Minutes `timeZone` is ahead of UTC at `at` (DST-correct, e.g. New York in
// summer = -240). Null when the zone is unknown.
function zoneOffsetMinutes(timeZone, at = new Date()) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone, hourCycle: 'h23',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        }).formatToParts(at);
        const get = (type) => Number(parts.find(p => p.type === type)?.value);
        const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
        const atMinute = Math.floor(at.getTime() / 60000) * 60000;
        return Math.round((asUTC - atMinute) / 60000);
    } catch (e) {
        return null;
    }
}

// "HH:mm" in `timeZone` → "HH:mm" UTC. This used to use the admin's browser
// zone and ignore the DJ Timezone field, so a slot typed from Pakistan for a
// US DJ was stored hours off. Falls back to the browser zone if `timeZone`
// is missing or unknown.
export function convertToUTC(time, timeZone) {
    const minutes = toMinutes(time);
    if (minutes == null) return time;
    let offset = timeZone ? zoneOffsetMinutes(timeZone) : null;
    if (offset == null) offset = -new Date().getTimezoneOffset();
    return toTime(minutes - offset);
}

// How many days the UTC start falls from the typed start: -1, 0 or +1.
// rawTime "20:00" with UTC "00:00" (New York, summer) → +1: a Monday 8 PM
// show starts on Tuesday in UTC. The difference between the two values is the
// offset that was used when the slot was saved, so no timezone is needed here.
export function utcDayShift(localTime, utcTime) {
    const local = toMinutes(localTime);
    const utc = toMinutes(utcTime);
    if (local == null || utc == null) return 0;
    // Read the difference as an offset between UTC-12 and UTC+12. (UTC+13/+14,
    // Tonga and Kiribati, can't be told apart from UTC-11/-10, Hawaii.)
    let diff = ((utc - local) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    if (diff > 12 * 60) diff -= MINUTES_PER_DAY;
    return Math.floor((local + diff) / MINUTES_PER_DAY);
}
