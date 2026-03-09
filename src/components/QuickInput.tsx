"use client";

import { useState } from "react";
import { VoiceButton } from "./VoiceButton";

interface QuickInputProps {
  onSubmit: (text: string) => void;
  loading: boolean;
}

export function QuickInput({ onSubmit, loading }: QuickInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setText("");
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript.trim()) {
      onSubmit(transcript.trim());
    }
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
      <div className="max-w-lg mx-auto flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="输入任务，如：下周三前交方案给客户A"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          disabled={loading}
        />
        <VoiceButton onTranscript={handleVoiceTranscript} disabled={loading} />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg disabled:opacity-40 shrink-0"
        >
          {loading ? "..." : "↑"}
        </button>
      </div>
    </div>
  );
}
