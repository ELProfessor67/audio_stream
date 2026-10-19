// Time-based one-time passwords (RFC 6238), the codes shown by Google
// Authenticator, Microsoft Authenticator, Authy and similar apps.
// Server-only: uses Node's crypto.
import crypto from 'crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;
// Accept the previous and next 30 s window to allow for phone clock drift.
const DRIFT_STEPS = 1;

export const TOTP_ISSUER = 'HGDJLive';

function base32Encode(buffer) {
	let bits = 0;
	let value = 0;
	let out = '';
	for (const byte of buffer) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += BASE32[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
	return out;
}

function base32Decode(text) {
	const clean = String(text).toUpperCase().replace(/[^A-Z2-7]/g, '');
	let bits = 0;
	let value = 0;
	const out = [];
	for (const char of clean) {
		value = (value << 5) | BASE32.indexOf(char);
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

export function generateSecret() {
	return base32Encode(crypto.randomBytes(20));
}

function hotp(secret, counter) {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64BE(BigInt(counter));
	const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(buf).digest();
	const offset = hmac[hmac.length - 1] & 0xf;
	const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
	return String(code).padStart(DIGITS, '0');
}

function currentStep(now = Date.now()) {
	return Math.floor(now / 1000 / STEP_SECONDS);
}

/**
 * Returns the matching time step, or null. Callers store the step and pass it
 * back as lastUsedStep so one code cannot be used twice.
 */
export function verifyTotp(secret, code, lastUsedStep = null) {
	const token = String(code || '').replace(/\s/g, '');
	if (!secret || !/^\d{6}$/.test(token)) return null;
	const step = currentStep();
	for (let drift = -DRIFT_STEPS; drift <= DRIFT_STEPS; drift++) {
		const candidate = step + drift;
		if (lastUsedStep != null && candidate <= lastUsedStep) continue;
		const expected = Buffer.from(hotp(secret, candidate));
		if (crypto.timingSafeEqual(expected, Buffer.from(token))) return candidate;
	}
	return null;
}

export function otpauthUrl(secret, accountName) {
	const label = encodeURIComponent(`${TOTP_ISSUER}:${accountName}`);
	const params = new URLSearchParams({
		secret,
		issuer: TOTP_ISSUER,
		algorithm: 'SHA1',
		digits: String(DIGITS),
		period: String(STEP_SECONDS),
	});
	return `otpauth://totp/${label}?${params.toString()}`;
}
