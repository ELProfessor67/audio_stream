// Server-only helpers for the two-step login (password, then a code).
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { generateOTP } from '@/utils/generateOTP';

// Short-lived httpOnly cookie that ties step 2 (the code) to the account that
// passed step 1 (the password).
const PENDING_COOKIE = 'pending_login';
const PENDING_PURPOSE = 'login-second-step';
const PENDING_MINUTES = 10;

export function setPendingLogin(res, userId) {
	const token = jwt.sign({ _id: String(userId), purpose: PENDING_PURPOSE }, process.env.JWT_SECRET, {
		expiresIn: `${PENDING_MINUTES}m`,
	});
	res.cookies.set({
		name: PENDING_COOKIE,
		value: token,
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		expires: new Date(Date.now() + PENDING_MINUTES * 60 * 1000),
	});
}

export function readPendingLogin(req) {
	const token = req.cookies.get(PENDING_COOKIE)?.value;
	if (!token) return null;
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		return payload?.purpose === PENDING_PURPOSE ? payload._id : null;
	} catch (e) {
		return null;
	}
}

export function clearPendingLogin(res) {
	res.cookies.set({ name: PENDING_COOKIE, value: '', httpOnly: true, path: '/', expires: new Date(0) });
}

// The user record without anything secret, for JSON responses.
export function publicUser(user) {
	if (!user) return user;
	const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
	delete plain.password;
	delete plain.OTP;
	delete plain.jwt;
	delete plain.resetPasswordToken;
	delete plain.resetPasswordExpire;
	delete plain.twoFactorSecret;
	delete plain.twoFactorTempSecret;
	delete plain.twoFactorLastStep;
	return plain;
}

// Generate, store and email a 6-digit login code.
export async function sendLoginOtp(user) {
	const OTP = generateOTP();
	user.OTP = OTP;
	await user.save();
	try {
		await axios.post('https://mail.hgdjlive.com/send-email', {
			email: user.email,
			subject: 'Verify OTP',
			message: `Your OTP is> ${OTP}`,
		}, {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		console.error('Login OTP email failed:', err.response?.data || err.message);
	}
}
