import { useRef, useState } from "react";
import { Mic } from "lucide-react";
import { Button, enterKey } from "./ui";

// Minimal typing for the Web Speech API (not in lib.dom for all browsers).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/** Text area with a "Say Your Idea" voice-input button (PRD F3). */
export function VoiceTextArea({
  value,
  onChange,
  placeholder,
  id,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
  /** Enter continues the step; Shift+Enter still starts a new line. */
  onEnter?: () => void;
}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = typeof window !== "undefined" && getRecognition() !== null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.onresult = (e) => onChange([value, e.results[0][0].transcript].filter(Boolean).join(" "));
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="rounded-2xl border border-ink/15 bg-white p-3">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={enterKey(onEnter)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none border-b border-ink/10 bg-transparent p-1 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={toggle} disabled={!supported} title={supported ? undefined : "Voice input isn't supported in this browser"}>
          <Mic className="h-4 w-4" aria-hidden />
          {listening ? "Listening…" : "Say Your Idea"}
        </Button>
      </div>
    </div>
  );
}
