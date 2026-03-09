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
    <div className="fixed bottom-[52px] left-0 right-0 bg-warm-50/90 backdrop-blur-lg border-t border-warm-200/60 px-4 py-3 z-40">
      <div className="max-w-lg mx-auto flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="输入任务，如：下周三前交方案给客户A"
          className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm outline-none border border-warm-200 focus:border-accent focus:ring-1 focus:ring-accent/20 placeholder:text-warm-400"
          disabled={loading}
        />
        <VoiceButton onTranscript={handleVoiceTranscript} disabled={loading} />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="bg-accent text-white rounded-xl w-10 h-10 flex items-center justify-center disabled:opacity-30 shrink-0 shadow-sm"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
