'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * YouTube-style seek bar with dummy buffer shadow.
 * Shadow creeps forward slowly on song load until the full track is "loaded".
 */
export default function DeckProgressBar({
	progress = 0,
	duration = 0,
	loading = false,
	songKey = '',
	onSeek,
}) {
	const [bufferLead, setBufferLead] = useState(0);
	const [isFullyBuffered, setIsFullyBuffered] = useState(false);

	const animRef = useRef(null);
	const songKeyRef = useRef('');
	const playPercentRef = useRef(0);

	const playPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
	playPercentRef.current = playPercent;

	const clearAnim = () => {
		if (animRef.current) {
			clearInterval(animRef.current);
			animRef.current = null;
		}
	};

	// Slowly creep shadow all the way to 100% — never stops halfway
	const startGradualFill = () => {
		clearAnim();
		setIsFullyBuffered(false);

		animRef.current = setInterval(() => {
			setBufferLead((prev) => {
				const play = playPercentRef.current;
				const floor = Math.max(play + 3, prev);

				if (floor >= 99.8) {
					clearAnim();
					setIsFullyBuffered(true);
					return 100;
				}

				const remaining = 100 - floor;
				// Fast at start, very gentle near the end (ease-out)
				const step = Math.max(0.06, remaining * 0.018 + (loading ? 0.35 : 0.2));

				return Math.min(100, floor + step);
			});
		}, 55);
	};

	// New song — reset and start fill from playhead
	useEffect(() => {
		if (!songKey) return;

		const key = String(songKey);
		if (key === songKeyRef.current) return;

		songKeyRef.current = key;
		setBufferLead(Math.max(playPercent + 2, 4));
		setIsFullyBuffered(false);
		startGradualFill();
	}, [songKey]);

	// Loading started — kick fill again if it stalled
	useEffect(() => {
		if (!songKey || !loading) return;
		setIsFullyBuffered(false);
		if (!animRef.current) startGradualFill();
	}, [loading, songKey]);

	// Seek / playhead jump — keep shadow ahead, resume fill if needed
	useEffect(() => {
		setBufferLead((prev) => {
			if (prev < playPercent + 4) return playPercent + 6;
			return prev;
		});

		if (!isFullyBuffered && !animRef.current) {
			startGradualFill();
		}
	}, [playPercent]);

	useEffect(() => () => clearAnim(), []);

	const formatTime = (seconds) => {
		const s = Math.max(0, Math.floor(seconds || 0));
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	};

	// Ahead-only band while filling; full grey bar once 100% buffered
	const showAheadBand = !isFullyBuffered && bufferLead > playPercent + 0.5;
	const aheadWidth = Math.max(0, bufferLead - playPercent);

	return (
		<div className="w-full flex flex-col gap-1">
			<div className="relative w-full h-5 flex items-center group">
				<div className="absolute inset-x-0 h-[4px] rounded-full bg-gray-300" />

				{/* Full-track buffered grey once dummy load completes */}
				{isFullyBuffered && (
					<div className="absolute left-0 h-[4px] rounded-full bg-gray-400/50 pointer-events-none z-[1]" style={{ width: '100%' }} />
				)}

				{/* Creeping ahead shadow while still loading */}
				{showAheadBand && (
					<div
						className="absolute h-[4px] rounded-r-full pointer-events-none z-[1] overflow-hidden transition-[width] duration-200 ease-out"
						style={{
							left: `${playPercent}%`,
							width: `${aheadWidth}%`,
							background:
								'linear-gradient(90deg, rgba(130,130,130,0.2) 0%, rgba(155,155,155,0.42) 55%, rgba(180,180,180,0.62) 100%)',
							boxShadow: '0 0 5px rgba(110,110,110,0.3)',
						}}
					>
						<span
							className="absolute inset-y-0 w-[45%] pointer-events-none"
							style={{
								background:
									'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
								animation: 'deck-shadow-sweep 2s ease-in-out infinite',
							}}
						/>
						<span
							className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[7px] h-[7px] rounded-full bg-gray-400/90"
							style={{ animation: 'deck-shadow-pulse 1.4s ease-in-out infinite' }}
						/>
					</div>
				)}

				{/* Played */}
				<div
					className="absolute left-0 h-[4px] rounded-full bg-red-600 transition-[width] duration-150 ease-linear pointer-events-none z-[2]"
					style={{ width: `${playPercent}%` }}
				/>

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
				{!isFullyBuffered && (
					<span className="text-[10px] text-gray-500 tracking-wide tabular-nums">
						Loading {Math.round(bufferLead)}%
					</span>
				)}
				<time className="text-black text-xs tabular-nums">{formatTime(duration)}</time>
			</div>

			<style jsx>{`
				@keyframes deck-shadow-sweep {
					0% { left: -45%; }
					100% { left: 115%; }
				}
				@keyframes deck-shadow-pulse {
					0%, 100% { opacity: 0.5; transform: translateY(-50%) translateX(50%) scale(0.9); }
					50% { opacity: 1; transform: translateY(-50%) translateX(50%) scale(1.05); }
				}
			`}</style>
		</div>
	);
}
