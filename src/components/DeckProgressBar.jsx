import { useEffect, useRef, useState } from 'react';

/**
 * YouTube-style seek bar with a dummy buffered shadow.
 * Songs are pre-loaded on the DJ deck, so the grey "loaded ahead" band is cosmetic only.
 */
export default function DeckProgressBar({
	progress = 0,
	duration = 0,
	loading = false,
	songKey = '',
	onSeek,
}) {
	const [bufferPercent, setBufferPercent] = useState(0);
	const animRef = useRef(null);
	const songKeyRef = useRef('');

	const playPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

	const clearAnim = () => {
		if (animRef.current) {
			clearInterval(animRef.current);
			animRef.current = null;
		}
	};

	const runBufferAnimation = (fromPercent = 0) => {
		clearAnim();
		setBufferPercent(Math.max(fromPercent, 6));

		animRef.current = setInterval(() => {
			setBufferPercent((prev) => {
				if (prev >= 97) return 97;
				if (prev < 50) return prev + 7 + Math.random() * 5;
				if (prev < 80) return prev + 3 + Math.random() * 2;
				return prev + 0.8 + Math.random() * 0.6;
			});
		}, 160);
	};

	// New song selected or loading started
	useEffect(() => {
		if (!songKey) return;

		const key = String(songKey);
		if (key !== songKeyRef.current) {
			songKeyRef.current = key;
			runBufferAnimation(playPercent);
			return;
		}

		if (loading) {
			runBufferAnimation(playPercent);
		}
	}, [songKey, loading]);

	// Loading finished — buffer fills to end
	useEffect(() => {
		if (!loading && songKey) {
			clearAnim();
			setBufferPercent(100);
		}
	}, [loading, songKey]);

	// While playing, keep shadow slightly ahead of playhead (YouTube feel)
	useEffect(() => {
		if (!loading && duration > 0) {
			setBufferPercent((prev) =>
				Math.max(prev, Math.min(100, playPercent + 22))
			);
		}
	}, [playPercent, loading, duration]);

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
				{/* Track background */}
				<div className="absolute inset-x-0 h-[4px] rounded-full bg-gray-300/90" />

				{/* Dummy buffered shadow */}
				<div
					className="absolute left-0 h-[4px] rounded-full bg-gray-500/45 transition-[width] duration-300 ease-out overflow-hidden pointer-events-none"
					style={{ width: `${bufferPercent}%` }}
				>
					{loading && (
						<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
					)}
				</div>

				{/* Played progress */}
				<div
					className="absolute left-0 h-[4px] rounded-full bg-red-600 transition-[width] duration-150 ease-linear pointer-events-none"
					style={{ width: `${playPercent}%` }}
				/>

				{/* Seek thumb — visible on hover */}
				<div
					className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-md"
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
						Buffering...
					</span>
				)}
				<time className="text-black text-xs tabular-nums">{formatTime(duration)}</time>
			</div>
		</div>
	);
}
