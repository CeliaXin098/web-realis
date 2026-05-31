"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: {
      transcript: string;
    };
  }>;
};

type VoiceWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function VoiceInputButton({
  className,
  label = "语音输入",
  showText = true,
  onTranscript,
}: {
  className?: string;
  label?: string;
  showText?: boolean;
  onTranscript: (text: string) => void;
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const voiceWindow = window as VoiceWindow;
    setSupported(Boolean(voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition));

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggleListening() {
    setError("");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      setError("当前浏览器暂不支持语音输入");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "zh-CN";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index]?.isFinal) {
          transcript += event.results[index][0].transcript;
        }
      }

      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };
    recognition.onerror = (event) => {
      setError(event.error === "not-allowed" ? "请允许浏览器使用麦克风" : "语音输入暂时不可用");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <span className="relative inline-flex">
      <button
        aria-label={isListening ? "停止语音输入" : label}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
          isListening
            ? "border-night bg-night text-paper shadow-[0_0_0_6px_rgba(39,54,49,0.10)]"
            : "border-[#ded6c8] bg-white/72 text-muted hover:bg-white hover:text-ink",
          !supported && "opacity-60",
          className,
        )}
        onClick={toggleListening}
        type="button"
      >
        {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        {showText ? <span>{isListening ? "正在聆听" : "语音"}</span> : null}
      </button>
      {error ? (
        <span className="font-sans-soft absolute left-1/2 top-[calc(100%+0.5rem)] z-20 w-44 -translate-x-1/2 rounded-2xl border border-clay/25 bg-[#fff7ef] px-3 py-2 text-center text-xs leading-5 text-[#8a4b39] shadow-lg">
          {error}
        </span>
      ) : null}
    </span>
  );
}
