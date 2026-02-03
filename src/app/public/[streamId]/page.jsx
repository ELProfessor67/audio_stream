"use client";
import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useLive as useLiveTest } from "@/context/LiveContextTest";

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
          maybePromise.catch(() => {});
        }
      } catch {
        /* no-op */
      }
    });
  }, []);

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
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px",width: "100%",height: "100vh",alignItems: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
        }}
      >
        <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 18 }}>
          Stream Controls {streamId ? `#${streamId}` : ""}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={playAll}
            style={{
              flex: 1,
              background: "#16a34a",
              color: "#fff",
              padding: "10px 12px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
			  display: isPlaying ? "none" : "block",
            }}
          >
            Play All
          </button>
          <button
            onClick={pauseAll}
            style={{
              flex: 1,
              background: "#dc2626",
              color: "#fff",
              padding: "10px 12px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
			  display: isPlaying ? "block" : "none",
            }}
          >
            Pause All
          </button>
        </div>
      </div>
    </div>
  );
}