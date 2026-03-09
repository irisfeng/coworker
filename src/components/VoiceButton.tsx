"use client";

import { useVoice } from "@/hooks/useVoice";
import { useState } from "react";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled: boolean;
}

export function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const { isRecording, startRecording, stopRecording, error } = useVoice();
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
        const data = await res.json();
        if (data.text) {
          onTranscript(data.text);
        }
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
      className={`rounded-full w-10 h-10 flex items-center justify-center text-lg shrink-0 ${
        isRecording
          ? "bg-red-500 text-white animate-pulse"
          : transcribing
          ? "bg-gray-300 text-gray-500"
          : "bg-gray-200 text-gray-600"
      } disabled:opacity-40`}
      title={isRecording ? "松开结束" : "点击录音"}
    >
      {transcribing ? "..." : isRecording ? "⏹" : "🎤"}
    </button>
  );
}
