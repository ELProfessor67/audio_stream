'use client';

import { useEffect, useRef, useState } from 'react';

const AHEAD_OFFSET = 32; // how far the dummy shadow sits ahead of playhead (%)

/**
 * YouTube-style seek bar: red = played, grey shadow band runs AHEAD of playhead.
 * Cosmetic only — songs are already fully loaded on the DJ deck.
 */
export default function DeckProgressBar({
	progress = 0,
	duration = 0,
	loading = false,
	songKey = '',
	onSeek,
}) {
	const [bufferLead, setBufferLead] = useState(0);
	const animRef = useRef(null);
	const songKeyRef = useRef('');

	const playPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
	const shadowWidth = Math.max(0, bufferLead - playPercent);

	const clearAnim = () => {
		if (animRef.current) {
			clearInterval(animRef.current);
			animRef.current = null;
		}
	};

	// Creep the shadow band forward ahead of the playhead
	const startShadowCreep = (fromPercent, speed = 'normal') => {
		clearAnim();

		const step = speed === 'fast' ? 1.2 : 0.45;
		const cap = speed === 'fast' ? 55 : AHEAD_OFFSET;

		animRef.current = setInterval(() => {
			setBufferLead((prev) => {
				const target = Math.min(100, fromPercent + cap);
				if (prev >= target - 0.2) return target;
				return prev + step + Math.random() * 0.3;
			});
		}, 80);
	};

	// New song or loading — shadow shoots ahead from playhead
	useEffect(() => {
		if (!songKey) return;

		const key = String(songKey);
		const isNewSong = key !== songKeyRef.current;

		if (isNewSong) {
			songKeyRef.current = key;
			setBufferLead(playPercent + 4);
			startShadowCreep(playPercent, 'fast');
			return;
		}

		if (loading) {
			setBufferLead(playPercent + 4);
			startShadowCreep(playPercent, 'fast');
		}
	}, [songKey, loading]);

	// During playback — shadow keeps chasing ahead of playhead
	useEffect(() => {
		if (!duration || loading) return;

		const target = Math.min(100, playPercent + AHEAD_OFFSET);

		setBufferLead((prev) => {
			// playhead jumped forward (seek/next) — restart creep if shadow fell behind
			if (prev < playPercent + 6) return playPercent + 8;
			if (prev < target) return Math.min(target, prev + 0.6);
			return Math.max(target, prev - 0.15); // gently pull back if playhead catches up
		});

		if (!animRef.current) {
			startShadowCreep(playPercent, 'normal');
		}
	}, [playPercent, duration, loading]);

	useEffect(() => () => clearAnim(), []);

	const formatTime = (seconds) => {
		const s = Math.max(0, Math.floor(seconds || 0));
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	};

	return (
		<div className="w-full flex flex-col gap-1">
			<div className="relative w-full h-5 flex items-center group">
				{/* Empty track */}
				<div className="absolute inset-x-0 h-[4px] rounded-full bg-gray-300" />

				{/* Played (red) — under the ahead shadow so shadow sits on top at the tip */}
				<div
					className="absolute left-0 h-[4px] rounded-full bg-red-600 transition-[width] duration-150 ease-linear pointer-events-none z-[2]"
					style={{ width: `${playPercent}%` }}
				/>

				{/* Dummy shadow band — ONLY ahead of playhead, YouTube style */}
				{shadowWidth > 0.5 && (
					<div
						className="absolute h-[4px] rounded-r-full pointer-events-none z-[1] overflow-hidden"
						style={{
							left: `${playPercent}%`,
							width: `${shadowWidth}%`,
							background:
								'linear-gradient(90deg, rgba(130,130,130,0.25) 0%, rgba(150,150,150,0.45) 60%, rgba(175,175,175,0.65) 100%)',
							boxShadow: '0 0 6px rgba(120,120,120,0.35)',
						}}
					>
						{/* Shimmer sweep across the shadow band */}
						<span
							className="absolute inset-y-0 w-[40%] pointer-events-none"
							style={{
								background:
									'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
								animation: 'deck-shadow-sweep 1.8s ease-in-out infinite',
							}}
						/>
						{/* Leading edge dot — the "loading front" */}
						<span
							className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[7px] h-[7px] rounded-full bg-gray-400/90 shadow-[0_0_4px_rgba(0,0,0,0.25)]"
							style={{ animation: 'deck-shadow-pulse 1.2s ease-in-out infinite' }}
						/>
					</div>
				)}

				{/* Seek thumb */}
				<div
					className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[3] shadow-md"
					style={{ left: `calc(${playPercent}% - 6px)` }}
				/>

				<input
					type="range"
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
					min={0}
					max={duration || 0}
					step={1}
					value={progress}
					onChange={(e) => onSeek?.(e.target.value)}
				/>
			</div>

			<div className="w-full flex items-center justify-between px-0.5">
				<time className="text-black text-xs tabular-nums">{formatTime(progress)}</time>
				{loading && (
					<span className="text-[10px] text-gray-500 tracking-wide animate-pulse">
						Loading ahead...
					</span>
				)}
				<time className="text-black text-xs tabular-nums">{formatTime(duration)}</time>
			</div>

			<style jsx>{`
				@keyframes deck-shadow-sweep {
					0% { left: -40%; }
					100% { left: 110%; }
				}
				@keyframes deck-shadow-pulse {
					0%, 100% { opacity: 0.55; transform: translateY(-50%) translateX(50%) scale(0.85); }
					50% { opacity: 1; transform: translateY(-50%) translateX(50%) scale(1.1); }
				}
			`}</style>
		</div>
	);
}
