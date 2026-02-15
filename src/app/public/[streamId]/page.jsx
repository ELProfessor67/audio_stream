"use client";
import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useLive as useLiveTest } from "@/context/LiveContextTest";

function PlayIcon({ size = 40, color = "#ffffff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7L8 5z" fill={color} />
    </svg>
  );
}

function PauseIcon({ size = 40, color = "#ffffff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
      <rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
    </svg>
  );
}

export default function Page() {
  const { streamId } = useParams() ?? {};
  const { isPlaying, setIsPlaying } = useLiveTest();

  const playAll = useCallback(() => {
    setIsPlaying(true);
    const audioElements = Array.from(document.querySelectorAll("audio"));
    audioElements.forEach((audio) => {
      try {
        const maybePromise = audio.play();
        if (maybePromise && typeof maybePromise.catch === "function") {
          // Ignore play() rejections (e.g., due to browser policies)
          maybePromise.catch(() => { });
        }
      } catch {
        /* no-op */
      }
    });
  }, [setIsPlaying]);

  const pauseAll = useCallback(() => {
    setIsPlaying(false);
    const audioElements = Array.from(document.querySelectorAll("audio"));
    audioElements.forEach((audio) => {
      try {
        audio.pause();
      } catch {
        /* no-op */
      }
    });
  }, [setIsPlaying]);

  const toggleAll = useCallback(() => {
    if (isPlaying) {
      pauseAll();
    } else {
      playAll();
    }
  }, [isPlaying, playAll, pauseAll]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        width: "100%",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(241,245,249,0.7), rgba(229,231,235,0.7))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 16,
          padding: 20,
          boxShadow:
            "0 10px 20px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18 }}>Stream Controls</div>
          {streamId ? (
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                border: "1px solid #e2e8f0",
                padding: "4px 8px",
                borderRadius: 999,
                background: "#f8fafc",
              }}
            >
              #{streamId}
            </div>
          ) : null}
        </div>

        <button
          onClick={toggleAll}
          aria-label={isPlaying ? "Pause all audio" : "Play all audio"}
          style={{
            width: 128,
            height: 128,
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            transition: "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
            boxShadow: isPlaying
              ? "0 10px 20px rgba(220,38,38,0.25)"
              : "0 10px 20px rgba(22,163,74,0.25)",
            background: isPlaying
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#ffffff",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isPlaying ? <PauseIcon size={48} /> : <PlayIcon size={48} />}
        </button>

        <div style={{ textAlign: "center", color: "#475569", fontSize: 14 }}>
          {isPlaying ? "Audio is playing" : "Audio is paused"}
        </div>
      </div>
    </div>
  );
}