import type { LucideIcon } from "lucide-react";
import {
  Compass,
  Footprints,
  Handshake,
  Heart,
  Lightbulb,
  MessageCircle,
  Minimize2,
  Mountain,
  Palette,
  Search,
  Shield,
  Sparkles,
  Sun,
  Target,
  Wind,
} from "lucide-react";
import { asset } from "@/data/assets";
import { cx } from "@/lib/text";

// Figma draws brave moves as small black glyphs and strengths as small
// coloured glyphs, so these use icons rather than illustrations.
const MOVE_ICONS: Record<string, LucideIcon> = {
  "shrink-the-giant": Minimize2,
  "find-first-step": Footprints,
  "ask-for-help": Handshake,
  "deep-breaths": Wind,
  "lead-the-way": Compass,
  "try-something-new": Sparkles,
  "stand-my-ground": Mountain,
  "calm-honesty": MessageCircle,
};

const STRENGTH_ICONS: Record<string, [LucideIcon, string]> = {
  "big-curiosity": [Search, "text-blue-500"],
  curious: [Search, "text-blue-500"],
  "kind-heart": [Heart, "text-rose-500 fill-rose-500"],
  empathetic: [Heart, "text-rose-500 fill-rose-500"],
  "clever-inventions": [Lightbulb, "text-amber-500 fill-amber-300"],
  inventive: [Lightbulb, "text-amber-500 fill-amber-300"],
  "super-focus": [Sun, "text-amber-400 fill-amber-200"],
  focused: [Target, "text-amber-500"],
  "creative-vision": [Palette, "text-teal-500"],
  imaginative: [Palette, "text-teal-500"],
  "brave-courage": [Shield, "text-slate-600 fill-slate-300"],
  resilient: [Shield, "text-slate-600 fill-slate-300"],
};

export function MoveIcon({ id }: { id: string }) {
  const Icon = MOVE_ICONS[id] ?? Sparkles;
  return <Icon className="h-6 w-6 text-ink" strokeWidth={2.25} aria-hidden />;
}

export function StrengthIcon({ id }: { id: string }) {
  const [Icon, color] = STRENGTH_ICONS[id] ?? [Sparkles, "text-brand"];
  return <Icon className={cx("h-6 w-6", color)} aria-hidden />;
}

/** Feeling / tool artwork from src/assets, or a neutral glyph if the file is missing. */
export function ArtIcon({ path, size = "h-8 w-8" }: { path: string; size?: string }) {
  const src = asset(path);
  if (src) return <img src={src} alt="" className={cx(size, "object-contain")} />;
  return <Sparkles className={cx(size, "p-1 text-brand/60")} aria-hidden />;
}
