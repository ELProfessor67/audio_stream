// Testing page room: one private LiveKit room per person.
// Every broadcaster joins as identity 'admin' (api/v1/token), and LiveKit allows one
// participant per identity in a room, so two people sharing a test room would kick
// each other out. DJs use their own id: auth.js replaces a DJ's user._id with the
// station's id and keeps theirs in originalId. Station accounts have no originalId,
// so they get a room named after their own id that can never be the live station room.
export const getTestRoomId = (user) => {
	if (user?.originalId) return user.originalId.toString();
	if (user?._id) return `test-${user._id}`;
	return null;
};
