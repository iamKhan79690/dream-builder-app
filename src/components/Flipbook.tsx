import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Image as ImageIcon, MessageSquare, Sparkles } from "lucide-react";
import { PANEL_LABELS } from "@/data/content";
import { asset, feelingPose, heroArt, heroAvatar, movePose, strengthPose, toolPose } from "@/data/assets";
import { pageQuote } from "@/data/storyText";
import { useAppState, type StoryState } from "@/state/AppState";
import { cx, possessive } from "@/lib/text";

/*
 * A realistic flip-through storybook.
 *
 * The story (15 parts, each one paragraph plus an optional quote) is typeset into real pages: every part opens a
 * new page with its illustration on top, and its text flows on, page after page, as far as it needs. Pages are
 * measured in a hidden copy of a page, so nothing ever scrolls.
 *
 * Wide screens show two-page spreads: cover · inside cover + title · story pages (text on both sides) · The End ·
 * inside back cover. Phones show one page at a time.
 *
 * A page turn is a "leaf" hinged at the spine, rotated in 3D. Its front is the page being turned and its back is
 * the page it lands as. The leaf lifts a little on hover, follows the pointer while dragged, and settles with a
 * transition otherwise.
 */

export const STORY_PARTS = PANEL_LABELS.length;
const DUR = 900;
const EASE = "cubic-bezier(0.33, 0.1, 0.2, 1)";

type Side = "left" | "right";
type Block = { t: "text"; text: string; first: boolean; cont: boolean } | { t: "quote"; text: string };
interface StoryPage {
  kind: "story";
  /** Printed page number. */
  num: number;
  /** Story part (1-15). */
  part: number;
  /** First page of its part: shows the illustration and the part title. */
  opener: boolean;
  blocks: Block[];
}
type Face = { kind: "cover" } | { kind: "endpaper"; back?: boolean } | { kind: "title" } | StoryPage | { kind: "end" } | { kind: "blank" };

/** Covers and endpapers are glued to the board, so they are drawn board-size instead of paper-size. */
const isBoard = (f: Face | null | undefined) => f?.kind === "cover" || f?.kind === "endpaper";

// Shared by the rendered pages and the hidden measuring page, so the measurements match exactly.
const C = {
  page: "flex h-full flex-col px-[9%] pb-[5%] pt-[6%]",
  head: "h-[1.5em] shrink-0 truncate text-center font-display text-[0.72em] italic leading-[1.5em] text-ink-faint",
  content: "mt-[0.8em] min-h-0 flex-1 overflow-hidden",
  foot: "mt-[0.5em] flex h-[1.4em] shrink-0 items-center justify-center gap-[0.6em] font-display text-[0.8em] font-semibold text-ink",
  img: "w-full shrink-0 overflow-hidden rounded-md",
  label: "mt-[0.9em] text-center text-[0.66em] font-extrabold uppercase tracking-[0.24em] text-amber-700",
  orn: "mb-[0.9em] mt-[0.45em]",
  p: "text-justify font-display text-[1.02em] leading-[1.7] text-ink [hyphens:auto]",
  drop: "first-letter:float-left first-letter:mr-[0.1em] first-letter:mt-[0.06em] first-letter:font-bold first-letter:text-[3.2em] first-letter:leading-[0.82] first-letter:text-amber-800",
  /** A paragraph that carries on overleaf: justify its last line too, like a printed book. */
  cont: "[text-align-last:justify]",
  quote: "mt-[0.9em] rounded-r-md border-l-[3px] border-amber-500 bg-amber-50/80 px-[0.8em] py-[0.5em] font-display text-[0.86em] italic leading-[1.5] text-amber-900",
  ornRow: "flex items-center justify-center gap-[0.6em] text-amber-600/80",
  ornLine: "h-px w-[2.5em] bg-amber-400/60",
  ornStar: "text-[0.8em]",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ORNAMENT_HTML = `<div class="${C.ornRow}"><span class="${C.ornLine}"></span><span class="${C.ornStar}">✦</span><span class="${C.ornLine}"></span></div>`;
const textHTML = (text: string, first: boolean, cont: boolean) => `<p class="${cx(C.p, first && C.drop, cont && C.cont)}">${esc(text)}</p>`;
const quoteHTML = (text: string) => `<p class="${C.quote}">${esc(text)}</p>`;

/**
 * Typesets the story into pages using a hidden page's content box (`box`). Each part starts a new page with its
 * illustration; its words fill pages until they run out (binary search per page); the quote follows.
 */
function paginate(box: HTMLElement, parts: { text: string; quote: string | null }[], imgClass: string): StoryPage[] {
  const pages: StoryPage[] = [];
  const fits = (html: string) => {
    box.innerHTML = html;
    return box.scrollHeight <= box.clientHeight + 1;
  };

  parts.forEach(({ text, quote }, i) => {
    const part = i + 1;
    let page: StoryPage = { kind: "story", num: 0, part, opener: true, blocks: [] };
    let html = `<div class="${cx(C.img, imgClass)}"></div><p class="${C.label}">${esc(PANEL_LABELS[i])}</p><div class="${C.orn}">${ORNAMENT_HTML}</div>`;
    const turnPage = () => {
      pages.push(page);
      page = { kind: "story", num: 0, part, opener: false, blocks: [] };
      html = "";
    };

    let words = text.trim().split(/\s+/).filter(Boolean);
    let first = true;
    let guard = 0;
    while (words.length && guard++ < 200) {
      // Largest number of words that still fits on this page.
      let lo = 0;
      let hi = words.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fits(html + textHTML(words.slice(0, mid).join(" "), first, mid < words.length))) lo = mid;
        else hi = mid - 1;
      }
      if (lo === 0) {
        if (page.blocks.length || page.opener) {
          turnPage();
          continue;
        }
        lo = 1; // a single word wider than an empty page: place it anyway
      }
      const chunk = words.slice(0, lo).join(" ");
      const cont = lo < words.length;
      page.blocks.push({ t: "text", text: chunk, first, cont });
      html += textHTML(chunk, first, cont);
      words = words.slice(lo);
      first = false;
      if (words.length) turnPage();
    }

    if (quote) {
      if (!fits(html + quoteHTML(quote)) && (page.blocks.length || page.opener)) turnPage();
      page.blocks.push({ t: "quote", text: quote });
      html += quoteHTML(quote);
    }
    pages.push(page);
  });

  box.innerHTML = "";
  pages.forEach((p, i) => (p.num = i + 1));
  return pages;
}

/**
 * Picture for a story part. The panels/ scenes illustrate the sample knight story
 * (BOOK_SAMPLE.md), so only a knight's book uses them; until the story
 * generator exists, other parts reuse the artwork for the child's own choices
 * in that part of the story (Glossary §2 panel order).
 */
function pageArt(page: number, story: StoryState): { src?: string; scene: boolean } {
  const panel = story.heroType === "knight" ? asset(`panels/panel-${String(page).padStart(2, "0")}.webp`) : undefined;
  if (panel) return { src: panel, scene: true };
  const hero = (pose: Parameters<typeof heroArt>[1]) => heroArt(story.heroType, pose);
  const obstacle = (ids: string[]) => (ids[0] ? asset(`obstacles/${ids[0]}.webp`) : undefined);
  const byPage: Record<number, string | undefined> = {
    1: hero("standing"), // Identity Anchor
    2: hero(strengthPose(story.charStrengths[0])), // Internal Gift
    3: hero("dream"), // The Call
    4: obstacle(story.obstacles) ?? hero("standing"), // First Shadow
    5: hero(movePose(1, story.braveMove)), // First Pivot
    6: hero(feelingPose(1, story.heartColor)), // The Heavy Heart
    7: hero("rest"), // Rest & Restoration
    8: obstacle(story.obstacles2) ?? hero("overwhelmed"), // Second Shadow
    9: hero(movePose(2, story.braveMove2)), // Second Brave Move
    10: hero(toolPose(story.charTools)), // Persistence
    11: hero("standing"), // Plateau Triumph
    12: obstacle(story.obstacles3) ?? hero("overwhelmed"), // Third Shadow / Deepest Pause
    13: hero(movePose(3, story.braveMove3)), // Final Pivot
    14: hero("dream"), // Grand Finale
    15: hero("breathe"), // Practice Anchor
  };
  const scene = page === 14 && !byPage[14];
  return { src: byPage[page] ?? asset("scenes/gate.webp"), scene };
}

// ---------------------------------------------------------------------------------------------------------------
// Small hooks

function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

let audio: AudioContext | null = null;
/** A soft paper "swish" for each page turn, synthesised so no sound file is needed. */
function playFlip() {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    if (ctx.state === "suspended") void ctx.resume();
    const len = Math.floor(ctx.sampleRate * 0.38);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.min(1, t * 8) * (1 - t) ** 2.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  } catch {
    // Audio unavailable: turn silently.
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Page faces

interface FaceCtx {
  story: StoryState;
  title: string;
  author: string;
  edition: "Explorer" | "Creator";
  notes?: Record<number, string>;
  /** Paper inset from the board edge, in px. */
  inset: number;
  imgClass: string;
}

/** Darkens the paper towards the spine, like a real bound page. */
function SpineShade({ side }: { side: Side }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: `linear-gradient(to ${side === "right" ? "right" : "left"}, rgba(60,40,10,0.20) 0%, rgba(60,40,10,0.07) 4%, rgba(60,40,10,0) 14%, rgba(255,255,255,0) 94%, rgba(255,255,255,0.35) 100%)`,
      }}
    />
  );
}

function Ornament() {
  return (
    <div aria-hidden className={C.ornRow}>
      <span className={C.ornLine} />
      <span className={C.ornStar}>✦</span>
      <span className={C.ornLine} />
    </div>
  );
}

function Illustration({ part, story, className }: { part: number; story: StoryState; className?: string }) {
  const art = pageArt(part, story);
  const label = `Illustration: ${PANEL_LABELS[part - 1]}`;
  if (!art.src) {
    return (
      <div role="img" aria-label={label} className={cx("flex flex-col items-center justify-center gap-2 bg-brand-soft/50 text-brand/60", className)}>
        <ImageIcon className="h-8 w-8" aria-hidden />
        <span className="px-4 text-center text-[0.75em] font-semibold">{PANEL_LABELS[part - 1]}</span>
      </div>
    );
  }
  if (art.scene) {
    return (
      <div className={className}>
        <img src={art.src} alt={label} draggable={false} className="h-full w-full select-none object-cover" />
      </div>
    );
  }
  // Character art has a transparent background, so paint a soft storybook sky and ground behind it.
  return (
    <div className={cx("relative bg-[linear-gradient(180deg,#DDEBFA_0%,#EEF0EC_52%,#F2E6CC_100%)]", className)}>
      <span aria-hidden className="absolute left-1/2 top-[6%] aspect-square h-[55%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,244,204,0.95)_0%,rgba(255,244,204,0)_70%)]" />
      <span aria-hidden className="absolute -left-[6%] top-[16%] h-[11%] w-[30%] rounded-full bg-white/70 blur-[2px]" />
      <span aria-hidden className="absolute -right-[5%] top-[30%] h-[9%] w-[24%] rounded-full bg-white/60 blur-[2px]" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[24%] rounded-t-[50%] bg-[#E6D7B4]/70" />
      <span aria-hidden className="absolute bottom-[8%] left-1/2 h-[8%] w-[34%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-md" />
      <img
        src={art.src}
        alt={label}
        draggable={false}
        className="absolute inset-x-[10%] bottom-[7%] top-[5%] h-[88%] w-[80%] select-none object-contain drop-shadow-[0_10px_14px_rgba(40,30,10,0.18)]"
      />
    </div>
  );
}

function PaperFace({ face, side, ctx }: { face: Face; side: Side; ctx: FaceCtx }) {
  const { story } = ctx;
  let body: ReactNode = null;

  if (face.kind === "story") {
    const note = face.opener && ctx.notes?.[face.part]?.trim();
    body = (
      <div className={C.page}>
        {/* Running head: the book's title on left pages, the part's title on right pages. */}
        <p className={C.head}>{side === "left" ? ctx.title : PANEL_LABELS[face.part - 1]}</p>
        <div className={C.content}>
          {face.opener && (
            <>
              <Illustration part={face.part} story={story} className={cx(C.img, ctx.imgClass)} />
              <p className={C.label}>{PANEL_LABELS[face.part - 1]}</p>
              <div className={C.orn}>
                <Ornament />
              </div>
            </>
          )}
          {face.blocks.map((b, i) =>
            b.t === "text" ? (
              <p key={i} className={cx(C.p, b.first && C.drop, b.cont && C.cont)}>
                {b.text}
              </p>
            ) : (
              <p key={i} className={C.quote}>
                {b.text}
              </p>
            ),
          )}
        </div>
        <div className={C.foot}>
          <span aria-hidden className="h-px w-[1.6em] bg-amber-400/60" />
          {face.num}
          <span aria-hidden className="h-px w-[1.6em] bg-amber-400/60" />
        </div>
        {note && (
          <span className="absolute right-[7%] top-0 flex items-center gap-1 rounded-b-md bg-amber-300 px-[0.6em] pb-[0.35em] pt-[0.5em] text-[0.62em] font-extrabold uppercase tracking-wide text-amber-900 shadow-sm">
            <MessageSquare className="h-[1.1em] w-[1.1em]" aria-hidden /> Note
          </span>
        )}
      </div>
    );
  } else if (face.kind === "title") {
    body = (
      <div className="flex h-full flex-col items-center px-[10%] pb-[8%] pt-[11%] text-center">
        <p className="text-[0.66em] font-extrabold uppercase tracking-[0.28em] text-brand">A Dream Builder Story</p>
        <h2 className="mt-[0.7em] font-display text-[2.05em] font-semibold leading-[1.1] text-ink">{ctx.title}</h2>
        <div className="mt-[1em]">
          <Ornament />
        </div>
        <div className="relative mt-[1.4em] flex aspect-square w-[42%] items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,#FFF6DA_0%,#EEEAFB_70%)] ring-[0.3em] ring-amber-200/70">
          {story.heroType && <img src={heroAvatar(story.heroType)} alt="" draggable={false} className="h-[88%] w-[88%] select-none object-contain" />}
        </div>
        <span className="flex-1" />
        <p className="text-[0.72em] font-semibold uppercase tracking-[0.2em] text-ink-muted">Written by</p>
        <p className="mt-[0.2em] font-display text-[1.3em] font-semibold text-ink">{ctx.author}</p>
        <p className="mt-[1.1em] text-[0.68em] font-bold text-ink-faint">{ctx.edition} Edition</p>
      </div>
    );
  } else if (face.kind === "end") {
    const art = heroArt(story.heroType, "breathe");
    body = (
      <div className="flex h-full flex-col items-center justify-center px-[10%] py-[8%] text-center">
        <Ornament />
        <h2 className="mt-[0.6em] font-display text-[2.6em] font-semibold italic leading-none text-ink">The End</h2>
        <div className="relative mt-[1.2em] aspect-square w-[52%]">
          <span aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,#FFF4CF_0%,rgba(255,244,207,0)_70%)]" />
          {art && <img src={art} alt="" draggable={false} className="relative h-full w-full select-none object-contain" />}
        </div>
        <p className="mt-[1em] max-w-[18em] font-display text-[0.92em] italic leading-[1.5] text-ink-muted">
          Thank you for reading <span className="not-italic text-ink">{ctx.title}</span>.
        </p>
        <p className="mt-[0.8em] text-[0.72em] font-bold text-ink-muted">A story by {ctx.author}</p>
      </div>
    );
  }

  return (
    <div className="paper relative h-full w-full overflow-hidden">
      {body}
      <SpineShade side={side} />
    </div>
  );
}

function BoardFace({ face, side, ctx, showOpenHint }: { face: Face; side: Side; ctx: FaceCtx; showOpenHint: boolean }) {
  const { story } = ctx;
  if (face.kind === "cover") {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-l-[3px] rounded-r-[10px] bg-[linear-gradient(150deg,#7457EA_0%,#5B3CD1_45%,#4527AE_100%)] text-white">
        {/* Hinge where the cover bends at the spine. */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        <span aria-hidden className="absolute inset-y-0 left-[6.5%] w-px bg-white/15" />
        {/* Gold foil frame. */}
        <span aria-hidden className="absolute inset-[5.5%] left-[10%] rounded-md border border-amber-200/45" />
        <span aria-hidden className="absolute inset-[7%] left-[11.5%] rounded border border-amber-200/20" />
        <span className="absolute right-[9%] top-0 flex h-[11%] w-[7%] items-end justify-center bg-amber-400 pb-[2%] shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]">
          <Bookmark className="h-[40%] w-[60%] fill-white text-white" aria-hidden />
        </span>
        <div className="relative flex h-full flex-col items-center px-[14%] pb-[9%] pl-[18%] pt-[13%] text-center">
          <span className="rounded-full bg-[#3B24A0]/60 px-[0.9em] py-[0.35em] text-[0.62em] font-extrabold uppercase tracking-[0.16em]">
            {ctx.edition} Edition
          </span>
          <h2 className="mt-[0.7em] font-display text-[2.3em] font-semibold leading-[1.05] [text-shadow:0_2px_10px_rgba(20,10,60,0.35)]">{ctx.title}</h2>
          <p className="mt-[0.6em] text-[0.9em] font-semibold text-white/90">by {ctx.author}</p>
          <div className="relative mt-[0.8em] min-h-0 w-full flex-1">
            <span aria-hidden className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.45)_0%,rgba(255,236,170,0)_68%)]" />
            {story.heroType && (
              <img src={heroAvatar(story.heroType)} alt="" draggable={false} className="relative h-full w-full select-none object-contain drop-shadow-[0_14px_18px_rgba(10,0,40,0.35)]" />
            )}
          </div>
          {showOpenHint && (
            <span className="mt-[0.6em] animate-pulse rounded-full bg-white/95 px-[1.1em] py-[0.45em] text-[0.72em] font-extrabold text-brand shadow-lg">
              Tap to open
            </span>
          )}
        </div>
        {/* Soft sheen across the laminated cover. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.12)_45%,rgba(255,255,255,0)_60%)]" />
      </div>
    );
  }

  // Endpaper glued inside the board.
  const back = face.kind === "endpaper" && face.back;
  const p = ctx.inset;
  return (
    <div className={cx("relative h-full w-full bg-[#4A2FB5]", side === "left" ? "rounded-l-[10px] rounded-r-[3px]" : "rounded-l-[3px] rounded-r-[10px]")}>
      <div className="endpaper absolute overflow-hidden" style={side === "left" ? { top: p, bottom: p, left: p, right: 0 } : { top: p, bottom: p, right: p, left: 0 }}>
        <div className="flex h-full items-center justify-center p-[10%]">
          {back ? (
            <div className="text-center text-brand/80">
              <Sparkles className="mx-auto h-[1.6em] w-[1.6em]" aria-hidden />
              <p className="mt-[0.5em] font-display text-[1em] font-semibold">Made with Dream Builder</p>
              <p className="mt-[0.2em] text-[0.7em] font-semibold">
                {ctx.author} · {new Date().getFullYear()}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-[16em] rounded-xl border-2 border-brand/20 bg-white/90 px-[1.4em] py-[1.6em] text-center shadow-[0_8px_24px_-12px_rgba(60,30,160,0.4)]">
              <p className="text-[0.66em] font-extrabold uppercase tracking-[0.24em] text-brand">This book belongs to</p>
              <p className="mt-[0.6em] font-display text-[1.6em] font-semibold italic text-ink">{ctx.author}</p>
              <span aria-hidden className="mx-auto mt-[0.3em] block h-px w-[80%] bg-brand/25" />
              <p className="mt-[0.9em] text-[0.7em] text-ink-muted">Author &amp; illustrator of their own adventure</p>
            </div>
          )}
        </div>
        <SpineShade side={side} />
      </div>
    </div>
  );
}

function FaceView({ face, side, ctx, showOpenHint = false }: { face: Face; side: Side; ctx: FaceCtx; showOpenHint?: boolean }) {
  return isBoard(face) ? <BoardFace face={face} side={side} ctx={ctx} showOpenHint={showOpenHint} /> : <PaperFace face={face} side={side} ctx={ctx} />;
}

// ---------------------------------------------------------------------------------------------------------------
// Book

interface Leaf {
  dir: 1 | -1;
  /** Turn progress, 0 (not lifted) to 1 (landed on the other side). */
  p: number;
  animating: boolean;
  dur: number;
  /** Lifted slightly because the mouse is hovering the page (not turned yet). */
  peek?: boolean;
}

export interface FlipbookProps {
  /** Text of a story part (1-15). */
  textFor: (part: number) => string;
  /** Shows an editor under the book for the parts on the open pages. */
  editing?: boolean;
  onTextChange?: (part: number, value: string) => void;
  /** Parent review notes per story part; a part's first page shows a tab when it has one. */
  notes?: Record<number, string>;
  /** `part` is the first story part on the open pages, or null on the cover, title and end pages. */
  onPositionChange?: (info: { part: number | null; atEnd: boolean }) => void;
  /** Replaces the "next" button on the last page (e.g. "I'm Done!"). */
  endAction?: ReactNode;
}

export function Flipbook({ textFor, editing = false, onTextChange, notes, onPositionChange, endAction }: FlipbookProps) {
  const { story, heroName, mode } = useAppState();
  const spreadMode = useMediaQuery("(min-width: 768px)");
  // Reduced motion (e.g. Windows "Animation effects" off) keeps every control working, with a quicker, softer turn.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const turnDur = reducedMotion ? 420 : DUR;
  const [pos, setPos] = useState(0);
  const [leaf, setLeafState] = useState<Leaf | null>(null);
  const leafRef = useRef<Leaf | null>(null);
  const [touched, setTouched] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  const [vh, setVh] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  const [fontsReady, setFontsReady] = useState(0);
  const [pages, setPages] = useState<StoryPage[]>([]);

  const setLeaf = (l: Leaf | null) => {
    leafRef.current = l;
    setLeafState(l);
  };

  // ---- Size: fit the book to the space and the screen height.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setAvail(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setAvail(entry.contentRect.width));
    ro.observe(el);
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Pages are measured with the book's fonts, so re-measure once the web fonts have loaded.
  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady((n) => n + 1));
  }, []);

  const W = spreadMode
    ? Math.max(Math.min(avail, 1040, (vh - 340) * 1.6), Math.min(avail, 620))
    : Math.max(Math.min(avail - 12, 440, (vh - 300) * 0.6), Math.min(avail - 12, 280));
  const H = spreadMode ? W / 1.6 : W / 0.6;
  const pageW = spreadMode ? W / 2 : W;
  const inset = Math.max(6, Math.round(H * 0.02));
  const paperW = spreadMode ? W / 2 - inset : W - inset;
  const paperH = H - 2 * inset;
  const fontSize = spreadMode ? Math.min(17, Math.max(12, W / 62)) : Math.min(16, Math.max(12.5, W / 24));
  const imgClass = spreadMode ? "aspect-[16/10]" : "aspect-[4/3]";

  // ---- Typeset the story into pages for the current page size.
  const parts = Array.from({ length: STORY_PARTS }, (_, i) => ({ text: textFor(i + 1), quote: pageQuote(i + 1, story) }));
  const partsKey = JSON.stringify(parts);
  useLayoutEffect(() => {
    const box = measureRef.current?.querySelector<HTMLElement>("[data-measure]");
    if (!box || paperW <= 0) return;
    setPages(paginate(box, JSON.parse(partsKey), imgClass));
  }, [partsKey, paperW, paperH, fontSize, imgClass, fontsReady]);

  // ---- The book's faces, in reading order.
  const faces: Face[] = [];
  if (spreadMode) {
    faces.push({ kind: "cover" }, { kind: "endpaper" }, { kind: "title" }, ...pages);
    // Finish on the inside back cover, which must be a right-hand page.
    if (faces.length % 2 === 0) faces.push({ kind: "end" }, { kind: "blank" });
    else faces.push({ kind: "end" });
    faces.push({ kind: "endpaper", back: true });
  } else {
    faces.push({ kind: "cover" }, { kind: "title" }, ...pages, { kind: "end" });
  }
  const LAST = spreadMode ? (faces.length - 1) / 2 : faces.length - 1;
  const faceAt = (i: number): Face | null => faces[i] ?? null;
  const visible = (p: number): Face[] => (spreadMode ? [faceAt(2 * p - 1), faceAt(2 * p)] : [faceAt(p)]).filter((f): f is Face => !!f);
  const storyOn = (p: number) => visible(p).filter((f): f is StoryPage => f.kind === "story");

  // Keep the reader on a real page if the book gets shorter (resize, edits).
  useEffect(() => {
    if (pos > LAST) setPos(LAST);
  }, [LAST, pos]);

  const firstPart = storyOn(pos)[0]?.part ?? null;
  useEffect(() => {
    onPositionChange?.({ part: firstPart, atEnd: pos === LAST });
  }, [firstPart, pos, LAST]); // eslint-disable-line react-hooks/exhaustive-deps

  const positionLabel = (p: number): { label: string; sub?: string } => {
    if (p === 0) return { label: "Cover", sub: "Tap the cover to open" };
    const shown = visible(p);
    const sp = storyOn(p);
    if (sp.length) {
      const nums = sp.map((s) => s.num);
      const range = nums.length > 1 ? `Pages ${nums[0]}–${nums[nums.length - 1]}` : `Page ${nums[0]}`;
      const labels = [...new Set(sp.map((s) => PANEL_LABELS[s.part - 1]))];
      return { label: `${range} of ${pages.length}`, sub: labels.join(" · ") };
    }
    if (shown.some((f) => f.kind === "end")) return { label: "The End" };
    if (shown.some((f) => f.kind === "title")) return { label: "Title page" };
    return { label: "Inside cover" };
  };

  // ---- Preload artwork so a turning page never shows an empty frame.
  useEffect(() => {
    const srcs = [heroAvatar(story.heroType ?? "fox"), heroArt(story.heroType, "breathe")];
    for (let p = 1; p <= STORY_PARTS; p++) srcs.push(pageArt(p, story).src);
    srcs.filter(Boolean).forEach((src) => {
      const img = new Image();
      img.src = src as string;
    });
  }, [story]);

  // ---- Turning
  const can = (dir: 1 | -1) => (dir === 1 ? pos < LAST : pos > 0);

  function turn(dir: 1 | -1) {
    const current = leafRef.current;
    if ((current && !current.peek) || !can(dir)) return;
    setTouched(true);
    playFlip();
    // A page lifted by hovering continues from where it is.
    const start = current?.peek && current.dir === dir ? current.p : 0;
    setLeaf({ dir, p: start, animating: false, dur: Math.round(turnDur * (1 - start * 0.5)) });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const l = leafRef.current;
        if (l && !l.animating) setLeaf({ ...l, p: 1, animating: true });
      }),
    );
  }

  function finish() {
    const l = leafRef.current;
    if (!l || !l.animating) return;
    if (l.p === 1) setPos((x) => x + l.dir);
    setLeaf(null);
  }

  function jump(to: number) {
    if (leafRef.current || to === pos) return;
    setTouched(true);
    setPos(to);
  }

  const turnRef = useRef(turn);
  turnRef.current = turn;
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Fallback in case transitionend doesn't fire (e.g. the leaf was already at its target).
  useEffect(() => {
    if (!leaf?.animating) return;
    const t = setTimeout(() => finishRef.current(), leaf.dur + 120);
    return () => clearTimeout(t);
  }, [leaf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") turnRef.current(1);
      if (e.key === "ArrowLeft") turnRef.current(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Hover / drag / tap / swipe
  const drag = useRef<{ id: number; x0: number; y0: number; t0: number; dir: 1 | -1 | 0; started: boolean } | null>(null);

  const dragProgress = (along: number) => {
    if (spreadMode) {
      // The page's free edge follows the pointer around the spine.
      const rel = Math.max(-1, Math.min(1, 1 - along / pageW));
      return Math.acos(rel) / Math.PI;
    }
    return Math.max(0, Math.min(1, along / (pageW * 1.25)));
  };

  const tapDir = (clientX: number): 1 | -1 => {
    // Closed book: the cover is drawn centred, so anywhere on it opens the book.
    if (pos === 0) return 1;
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return 1;
    const x = (clientX - rect.left) / rect.width;
    return spreadMode ? (x >= 0.5 ? 1 : -1) : x >= 0.3 ? 1 : -1;
  };

  /** Hover: lift the page under the mouse a little, more towards its outer edge. */
  function peek(clientX: number) {
    const current = leafRef.current;
    if (current && !current.peek) return;
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / rect.width;
    let dir: 1 | -1 | 0 = 0;
    let t = 0; // 0 at the spine, 1 at the page's outer edge
    if (!spreadMode) {
      dir = 1;
      t = x;
    } else if (pos === 0) {
      if (x >= 0.25 && x <= 0.75) {
        dir = 1;
        t = (x - 0.25) / 0.5;
      }
    } else if (x >= 0.5) {
      dir = 1;
      t = (x - 0.5) / 0.5;
    } else {
      dir = -1;
      t = (0.5 - x) / 0.5;
    }
    if (!dir || !can(dir)) {
      unpeek();
      return;
    }
    // Up to ~9° at the outer edge: a gentle hint, not a half-turned page.
    const p = 0.01 + 0.04 * Math.max(0, Math.min(1, t)) ** 2;
    setLeaf({ dir, p, animating: false, dur: 0, peek: true });
  }

  function unpeek() {
    const current = leafRef.current;
    if (current?.peek) setLeaf({ ...current, p: 0, animating: true, dur: 220, peek: false });
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (leafRef.current?.animating || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("textarea, button, a, input")) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), dir: 0, started: false };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d && e.pointerType === "mouse") {
      peek(e.clientX);
      return;
    }
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.started) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // vertical scroll, not a page turn
        return;
      }
      let dir: 1 | -1 = dx < 0 ? 1 : -1;
      if (spreadMode) {
        dir = tapDir(d.x0);
        if ((dir === 1 && dx > 0) || (dir === -1 && dx < 0)) {
          drag.current = null;
          return;
        }
      }
      const current = leafRef.current;
      if (!can(dir) || (current && !current.peek)) {
        drag.current = null;
        return;
      }
      d.dir = dir;
      d.started = true;
      setTouched(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      setLeaf({ dir, p: current?.peek && current.dir === dir ? current.p : 0, animating: false, dur: turnDur });
    }
    const along = d.dir === 1 ? -dx : dx;
    const l = leafRef.current;
    // Keep a slight lift while held, so the page never snaps flat under the pointer.
    if (l && !l.animating) setLeaf({ ...l, p: Math.max(0.025, dragProgress(along)), peek: false });
  }

  function release(e: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (!d.started) {
      if (!cancelled) turn(tapDir(d.x0));
      return;
    }
    const l = leafRef.current;
    if (!l) return;
    const dx = e.clientX - d.x0;
    const along = d.dir === 1 ? -dx : dx;
    const speed = along / Math.max(1, performance.now() - d.t0); // px per ms
    const complete = !cancelled && (l.p > 0.33 || (speed > 0.45 && l.p > 0.05));
    if (complete) playFlip();
    const remaining = complete ? 1 - l.p : l.p;
    setLeaf({ ...l, p: complete ? 1 : 0, animating: true, dur: Math.max(220, Math.round(turnDur * 0.8 * remaining)) });
  }

  // ---- Drawing
  const ctx: FaceCtx = {
    story,
    title: `${possessive(heroName)} Magical Journey`,
    author: story.authorName || "Author Name",
    edition: mode === "senior" ? "Creator" : "Explorer",
    notes,
    inset,
    imgClass,
  };

  const transition = (props: string[]) =>
    leaf?.animating
      ? props.map((p) => `${p} ${leaf.dur}ms ${EASE}`).join(", ")
      : leaf?.peek
        ? props.map((p) => `${p} 180ms ease-out`).join(", ")
        : "none";

  let angle = 0;
  let q = 0; // how far the leaf has rotated, 0..1, for lighting
  if (leaf) {
    if (spreadMode) angle = leaf.dir === 1 ? -180 * leaf.p : 180 * leaf.p;
    else angle = leaf.dir === 1 ? -180 * leaf.p : -180 * (1 - leaf.p);
    q = Math.abs(angle) / 180;
  }
  const frontDark = Math.min(1, q * 2) * 0.32;
  const backDark = Math.min(1, (1 - q) * 2) * 0.32;

  // Slot geometry: board faces fill the board, paper sits inside it.
  const slot = (face: Face | null, side: Side): CSSProperties => {
    const board = isBoard(face);
    if (!spreadMode) return board ? { top: 0, bottom: 0, left: 0, right: 0 } : { top: inset, bottom: inset, left: 0, right: inset };
    const base: CSSProperties = board ? { top: 0, bottom: 0, width: "50%" } : { top: inset, bottom: inset, width: `calc(50% - ${inset}px)` };
    return side === "left" ? { ...base, left: board ? 0 : inset } : { ...base, right: board ? 0 : inset };
  };

  // Page-edge thickness for n leaves.
  const stack = (n: number) => (n <= 0 ? 0 : Math.min(inset - 1, 1.5 + n * 0.32));

  const leafEl = (front: Face, back: Face, side: Side) => (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10" style={{ perspective: `${W * (spreadMode ? 2.4 : 3)}px` }}>
      <div
        className="preserve-3d absolute"
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "transform") finish();
        }}
        style={{
          ...slot(front, side),
          transformOrigin: side === "right" ? "left center" : "right center",
          transform: `rotateY(${angle}deg)`,
          transition: transition(["transform"]),
        }}
      >
        <div className="backface-hidden absolute inset-0">
          <FaceView face={front} side={side} ctx={ctx} />
          <span className="absolute inset-0 bg-[#1b1205]" style={{ opacity: frontDark, transition: transition(["opacity"]) }} />
        </div>
        <div className="backface-hidden absolute inset-0" style={{ transform: "rotateY(180deg)" }}>
          <FaceView face={back} side={side === "right" ? "left" : "right"} ctx={ctx} />
          <span className="absolute inset-0 bg-[#1b1205]" style={{ opacity: backDark, transition: transition(["opacity"]) }} />
        </div>
      </div>
    </div>
  );

  let content: ReactNode;
  if (spreadMode) {
    const k = pos;
    let leftF = faceAt(2 * k - 1);
    let rightF = faceAt(2 * k);
    let front: Face | null = null;
    let back: Face | null = null;
    if (leaf?.dir === 1) {
      rightF = faceAt(2 * k + 2);
      front = faceAt(2 * k);
      back = faceAt(2 * k + 1);
    } else if (leaf?.dir === -1) {
      leftF = faceAt(2 * k - 3);
      front = faceAt(2 * k - 1);
      back = faceAt(2 * k - 2);
    }
    const leafSide: Side = leaf?.dir === -1 ? "left" : "right";
    const totalLeaves = Math.max(0, LAST - 1); // paper leaves between the covers
    const turnedLeaves = Math.max(0, k - 1);
    const rightLeaves = k === 0 ? totalLeaves : totalLeaves - turnedLeaves;
    const closed = k === 0 ? (leaf?.dir === 1 ? 1 - leaf.p : 1) : k === 1 && leaf?.dir === -1 ? leaf.p : 0;
    const paperV = { top: inset, bottom: inset };
    const under = leafSide === "right" ? rightF : leftF;
    const covered = leafSide === "right" ? leftF : rightF;

    content = (
      <div className="relative h-full w-full" style={{ transform: `translateX(${-25 * closed}%)`, transition: transition(["transform"]) }}>
        {/* Boards (the hard covers) */}
        <div className="absolute inset-y-0 right-0 w-1/2 rounded-l-[3px] rounded-r-[10px] bg-[#4A2FB5] shadow-[0_34px_60px_-28px_rgba(40,20,120,0.65)]" />
        {k >= 2 && <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-[10px] rounded-r-[3px] bg-[#4A2FB5] shadow-[0_34px_60px_-28px_rgba(40,20,120,0.65)]" />}
        {/* Page edges: thick on the side still to read, thin on the side already read. */}
        {k >= 1 && rightLeaves > 0 && (
          <div className="page-stack absolute rounded-r-[2px]" style={{ ...paperV, right: inset - stack(rightLeaves), width: stack(rightLeaves) }} />
        )}
        {k >= 2 && turnedLeaves > 0 && (
          <div className="page-stack absolute rounded-l-[2px]" style={{ ...paperV, left: inset - stack(turnedLeaves), width: stack(turnedLeaves) }} />
        )}

        {leftF && (
          <div className="absolute" style={slot(leftF, "left")}>
            <FaceView face={leftF} side="left" ctx={ctx} />
          </div>
        )}
        {rightF && (
          <div className="absolute" style={slot(rightF, "right")}>
            <FaceView face={rightF} side="right" ctx={ctx} showOpenHint={k === 0 && (!leaf || !!leaf.peek)} />
          </div>
        )}

        {/* Shadow the moving leaf casts on the page it uncovers, and on the page it falls onto. */}
        {leaf && under && !isBoard(under) && (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              ...paperV,
              width: `calc(50% - ${inset}px)`,
              [leafSide]: inset,
              background: `linear-gradient(to ${leafSide}, rgba(30,20,0,0.45), rgba(30,20,0,0.12) 40%, rgba(30,20,0,0) 75%)`,
              opacity: (1 - q) * 0.9,
              transition: transition(["opacity"]),
            }}
          />
        )}
        {leaf && covered && (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              ...paperV,
              width: `calc(50% - ${inset}px)`,
              [leafSide === "right" ? "left" : "right"]: inset,
              background: `linear-gradient(to ${leafSide === "right" ? "left" : "right"}, rgba(30,20,0,0.35), rgba(30,20,0,0) 60%)`,
              opacity: q * 0.8,
              transition: transition(["opacity"]),
            }}
          />
        )}

        {leaf && front && back && leafEl(front, back, leafSide)}
      </div>
    );
  } else {
    let current = faceAt(pos);
    let front: Face | null = null;
    if (leaf?.dir === 1) {
      current = faceAt(pos + 1);
      front = faceAt(pos);
    } else if (leaf?.dir === -1) {
      front = faceAt(pos - 1);
    }
    const remaining = LAST - pos;
    content = (
      <div className="relative h-full w-full">
        <div className="absolute inset-0 rounded-l-[3px] rounded-r-[10px] bg-[#4A2FB5] shadow-[0_30px_50px_-24px_rgba(40,20,120,0.65)]">
          <span aria-hidden className="absolute inset-y-0 left-0 w-[4%] rounded-l-[3px] bg-gradient-to-r from-black/35 to-transparent" />
        </div>
        {pos >= 1 && remaining > 0 && (
          <div className="page-stack absolute rounded-r-[2px]" style={{ top: inset, bottom: inset, right: inset - stack(remaining), width: stack(remaining) }} />
        )}
        {current && (
          <div className="absolute" style={slot(current, "right")}>
            <FaceView face={current} side="right" ctx={ctx} showOpenHint={pos === 0 && (!leaf || !!leaf.peek)} />
          </div>
        )}
        {leaf && current && !isBoard(current) && (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              ...slot(current, "right"),
              background: "linear-gradient(to right, rgba(30,20,0,0.45), rgba(30,20,0,0.1) 45%, rgba(30,20,0,0) 80%)",
              opacity: 1 - q,
              transition: transition(["opacity"]),
            }}
          />
        )}
        {leaf && front && leafEl(front, { kind: "blank" }, "right")}
      </div>
    );
  }

  const { label, sub } = positionLabel(pos);
  const round = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40";
  const navBtn = cx(round, "border border-ink/10 bg-white text-ink hover:border-brand/40 hover:text-brand disabled:hover:border-ink/10 disabled:hover:text-ink");
  // Separate class list (not an override): cx() doesn't merge Tailwind classes, so mixing bg-white/bg-brand hid the arrow.
  const nextBtn = cx(round, "bg-brand text-white hover:bg-brand-dark disabled:hover:bg-brand");
  const busy = !!leaf && !leaf.peek;
  const editParts = [...new Set(storyOn(pos).map((s) => s.part))];

  return (
    <div ref={wrapRef} className="flex w-full flex-col items-center">
      {/* Hidden page used to measure how much text fits. */}
      <div
        ref={measureRef}
        aria-hidden
        className="paper pointer-events-none fixed left-[-10000px] top-0 overflow-hidden"
        style={{ width: paperW, height: paperH, fontSize, visibility: "hidden" }}
      >
        <div className={C.page}>
          <p className={C.head}>Running head</p>
          <div data-measure className={C.content} />
          <div className={C.foot}>1</div>
        </div>
      </div>

      {avail > 0 && (
        <>
          <div
            ref={bookRef}
            role="region"
            aria-roledescription="book"
            aria-label={`${ctx.title}, ${label}`}
            className="relative cursor-grab select-none active:cursor-grabbing"
            style={{ width: W, height: H, fontSize, touchAction: "pan-y" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => release(e, false)}
            onPointerCancel={(e) => release(e, true)}
            onPointerLeave={() => !drag.current && unpeek()}
          >
            {content}
          </div>
          <p className="sr-only" aria-live="polite">
            {label}
            {sub && pos > 0 ? `: ${sub}` : ""}
          </p>

          <div className="mt-6 flex w-full items-center gap-3" style={{ maxWidth: Math.max(W, 300) }}>
            <button type="button" className={navBtn} onClick={() => turn(-1)} disabled={pos === 0 || busy} aria-label="Previous page">
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 text-sm font-extrabold text-brand">{label}</span>
                {sub && <span className="truncate text-xs font-semibold text-ink-muted">{sub}</span>}
              </div>
              <div className="mt-1 flex gap-[3px]" role="group" aria-label="Jump to page">
                {Array.from({ length: LAST + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => jump(i)}
                    aria-label={`Go to ${positionLabel(i).label}`}
                    aria-current={i === pos ? "page" : undefined}
                    className="group flex-1 py-1.5"
                  >
                    <span
                      className={cx(
                        "block h-1.5 rounded-full transition-colors",
                        i === pos ? "bg-brand" : i < pos ? "bg-brand/45 group-hover:bg-brand/70" : "bg-brand/15 group-hover:bg-brand/35",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            {pos === LAST && endAction ? (
              endAction
            ) : (
              <button type="button" className={nextBtn} onClick={() => turn(1)} disabled={pos === LAST || busy} aria-label="Next page">
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
          {!touched && !editing && (
            <p className="mt-3 text-center text-xs text-ink-muted">
              {spreadMode ? "Hover a page to lift it, then click or drag it to turn. The ← → keys work too." : "Swipe or tap the page to turn it."}
            </p>
          )}

          {/* Editing happens here, not inside the page, so the pages stay real, unscrolled print. */}
          {editing && editParts.length > 0 && (
            <div className="mt-6 grid w-full gap-3 md:grid-cols-2" style={{ maxWidth: Math.max(W, 300) }}>
              {editParts.map((part) => (
                <label key={part} className="block rounded-2xl border border-brand/20 bg-white p-4 shadow-sm">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-brand">{PANEL_LABELS[part - 1]}</span>
                  <textarea
                    rows={5}
                    value={textFor(part)}
                    onChange={(e) => onTextChange?.(part, e.target.value)}
                    className="mt-2 w-full resize-y rounded-xl border border-ink/10 bg-tile/50 p-3 font-display text-sm leading-relaxed text-ink focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
