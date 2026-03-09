"use client";

import { useVoice } from "@/hooks/useVoice";
import { useState } from "react";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled: boolean;
}

export function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const { isRecording, startRecording, stopRecording } = useVoice();
  const [transcribing, setTranscribing] = useState(false);

  const handlePress = async () => {
    if (disabled || transcribing) return;

    if (isRecording) {
      const blob = await stopRecording();
      if (!blob) return;

      setTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.pcm");
        const res = await fetch("/api/asr", { method: "POST", body: formData });
        if (!res.ok) {
          throw new Error(`ASR request failed with status ${res.status}`);
        }
        const data = await res.json();
        const transcript = typeof data.text === "string" ? data.text.trim() : "";
        if (!transcript) {
          throw new Error("ASR returned empty transcript");
        }
        onTranscript(transcript);
      } catch (err) {
        console.error("ASR failed:", err);
      } finally {
        setTranscribing(false);
      }
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={handlePress}
      disabled={disabled || transcribing}
      className={`rounded-xl w-10 h-10 flex items-center justify-center shrink-0 border transition-all ${
        isRecording
          ? "bg-danger text-white border-danger animate-pulse shadow-sm"
          : transcribing
          ? "bg-warm-100 text-warm-400 border-warm-200"
          : "bg-white text-warm-600 border-warm-200 active:bg-warm-100"
      } disabled:opacity-30`}
      title={isRecording ? "松开结束" : "点击录音"}
    >
      {transcribing ? (
        <div className="w-4 h-4 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin" />
      ) : isRecording ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}
