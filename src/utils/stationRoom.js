// hgcradio always listens in the station owner's room
// (client RadioContext streamId). /load-me returns a DJ's own _id — auth.js
// skips the djOwner swap on that route so the panel can show the DJ's name,
// tones and permissions. Go Live, chat and song updates still have to use
// djOwner, or that DJ never appears on the public site. The admin account's
// _id already is the station room.
export function stationRoomId(user) {
	if (!user) return '';
	const owner = user.isDJ && user.djOwner ? user.djOwner : user._id;
	if (owner && typeof owner === 'object') return String(owner._id || '');
	return owner ? String(owner) : '';
}
