'use client';
import { useEffect } from 'react';
import { MdCall, MdCallEnd } from 'react-icons/md';

// Callers send "name|location".
export function parseCaller(raw) {
	const [name, location] = String(raw || '').split('|');
	return { name: name?.trim() || 'A listener', location: location?.trim() || '' };
}

const RING_EVERY_MS = 2500;
const RING_FOR_MS = 45000;

// A soft two-tone ring on the DJ's own speakers. It uses its own AudioContext
// that is never connected to the broadcast, so listeners do not hear it.
function startRinging() {
	const Ctx = window.AudioContext || window.webkitAudioContext;
	if (!Ctx) return () => {};
	let ctx;
	try { ctx = new Ctx(); } catch (e) { return () => {}; }

	const ring = () => {
		if (ctx.state === 'suspended') ctx.resume().catch(() => {});
		const now = ctx.currentTime;
		[0, 0.45].forEach((offset) => {
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0, now + offset);
			gain.gain.linearRampToValueAtTime(0.08, now + offset + 0.03);
			gain.gain.setValueAtTime(0.08, now + offset + 0.32);
			gain.gain.linearRampToValueAtTime(0, now + offset + 0.38);
			gain.connect(ctx.destination);
			[440, 480].forEach((freq) => {
				const osc = ctx.createOscillator();
				osc.frequency.value = freq;
				osc.connect(gain);
				osc.start(now + offset);
				osc.stop(now + offset + 0.4);
			});
		});
	};

	ring();
	const interval = setInterval(ring, RING_EVERY_MS);
	const stopAfter = setTimeout(() => clearInterval(interval), RING_FOR_MS);
	return () => {
		clearInterval(interval);
		clearTimeout(stopAfter);
		ctx.close().catch(() => {});
	};
}

export default function IncomingCallBanner({ open, callerName, onAnswer, onDecline }) {
	const { name, location } = parseCaller(callerName);

	useEffect(() => {
		if (!open) return;
		const stopRinging = startRinging();

		// Flash the tab title so the call is seen even from another tab.
		const originalTitle = document.title;
		let flip = false;
		const titleTimer = setInterval(() => {
			flip = !flip;
			document.title = flip ? `📞 ${name} is calling` : originalTitle;
		}, 1000);

		return () => {
			stopRinging();
			clearInterval(titleTimer);
			document.title = originalTitle;
		};
	}, [open, name]);

	if (!open) return null;

	return (
		<div
			role="alertdialog"
			aria-live="assertive"
			aria-label={`${name} is calling you`}
			className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[min(32rem,calc(100%-2rem))] rounded-xl bg-white shadow-2xl border-2 border-green-500 p-4 flex items-center gap-4"
		>
			<span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-60" />
				<MdCall size={26} className="relative" />
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm text-gray-500">Incoming listener call</p>
				<h2 className="text-lg font-semibold text-gray-900 truncate">{name} is trying to call you</h2>
				{location && <p className="text-sm text-gray-500 truncate">{location}</p>}
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onClick={onAnswer}
					className="flex items-center gap-1 rounded-full bg-green-600 hover:bg-green-700 text-white px-4 py-2"
				>
					<MdCall size={18} /> Answer
				</button>
				<button
					type="button"
					onClick={onDecline}
					className="flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 text-white px-4 py-2"
				>
					<MdCallEnd size={18} /> Decline
				</button>
			</div>
		</div>
	);
}
