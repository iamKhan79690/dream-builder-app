import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, Wand2 } from "lucide-react";
import { CHAPTERS } from "@/data/content";
import { EMPTY_STORY, useAppState } from "@/state/AppState";
import { ROUTES } from "@/lib/routes";
import { cx } from "@/lib/text";
import { ChapterPill, Progress } from "./ui";
import { MemoryBox } from "./MemoryBox";

export function Logo({ plain }: { plain?: boolean }) {
  if (plain) return <span className="text-xl font-bold text-ink">Dream Builder</span>;
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
        <Wand2 className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-xl font-bold text-ink">Dream Builder</span>
        <span className="hidden text-xs text-ink-muted sm:block">Magical Story Studio for Young Authors</span>
      </span>
    </Link>
  );
}

/** Figma page frame: 1280px container with 32px gutters. */
const CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-8";

/** Page frame: pastel background, 72px header, content centred in the space below it. */
export function AppShell({
  right,
  plainLogo,
  tone,
  children,
}: {
  right?: ReactNode;
  plainLogo?: boolean;
  /** "warm" = default pastel wash; "calm" = lavender (format/style steps and Creator Mode). */
  tone?: "warm" | "calm";
  children: ReactNode;
}) {
  const { mode, parent } = useAppState();
  const [path] = useLocation();
  // Creator Mode story screens use the lavender wash in Figma.
  const resolved = tone ?? (mode === "senior" && path.startsWith("/story") ? "calm" : "warm");
  const parentPage = path.startsWith("/parent") || path.startsWith("/checkout");

  return (
    <div className={cx("flex min-h-screen flex-col", resolved === "warm" ? "bg-dream" : "bg-calm")}>
      {/* Sticky so the navbar stays visible while scrolling; frosted so content doesn't show through. */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-ink/5 bg-white/70 backdrop-blur-md">
        <div className={cx(CONTAINER, "flex h-[72px] items-center justify-between gap-4")}>
          <Logo plain={plainLogo} />
          {right ?? (parentPage && parent.account && <ParentMenu />)}
        </div>
      </header>
      <main className={cx(CONTAINER, "flex flex-1 flex-col py-8 sm:py-12")}>{children}</main>
    </div>
  );
}

export type ChapterRef = number | "final" | { label: string };

/** Parent pages: signed-in email + sign out. */
function ParentMenu() {
  const [path, navigate] = useLocation();
  const { parent, updateParent, updateStory } = useAppState();
  if (!parent.account) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-ink-muted">
      {path !== ROUTES.dashboard && (
        <Link href={ROUTES.dashboard} className="font-bold text-brand hover:underline">
          Dashboard
        </Link>
      )}
      <span className="hidden sm:inline">{parent.account.email}</span>
      <button
        type="button"
        className="rounded-lg border border-ink/15 bg-white px-3 py-1.5 font-bold text-ink hover:bg-tile"
        onClick={() => {
          updateParent({ account: null, activeChildId: null, order: null });
          updateStory(EMPTY_STORY);
          navigate(ROUTES.login);
        }}
      >
        Sign out
      </button>
    </div>
  );
}

export function chapterLabel(n: ChapterRef): string {
  if (typeof n === "object") return n.label;
  if (n === "final") return "The Final Act";
  return `Chapter ${n} of ${CHAPTERS.length}: ${CHAPTERS[n - 1]}`;
}

/** Two-column wizard step: 656px card on the left, artwork centred in the right column. */
export function WizardLayout({
  chapter,
  progress,
  asset,
  art,
  aside,
  children,
}: {
  chapter: ChapterRef;
  progress?: { total: number; current: number };
  /** Description of the artwork shown beside the card. */
  asset?: string;
  /** URL of that artwork, when the image exists. */
  art?: string;
  /** Replaces the artwork slot (e.g. the live book cover). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell right={<ChapterPill>{chapterLabel(chapter)}</ChapterPill>}>
      <div className="my-auto grid w-full items-center gap-8 lg:grid-cols-[minmax(0,656px)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[656px] lg:mx-0">
          {progress && <Progress {...progress} />}
          {children}
        </div>
        {/* Stretches to the card height; the art stays in view while a tall card scrolls. */}
        <div className="hidden self-stretch lg:block">
          <div className="sticky top-[72px] flex h-full max-h-[calc(100vh-72px)] items-center justify-center">
            {aside ?? <HeroArt label={asset ?? "Hero artwork"} src={art} />}
          </div>
        </div>
      </div>
      <MemoryBox />
    </AppShell>
  );
}

function HeroArt({ label, src }: { label: string; src?: string }) {
  if (src) {
    return <img src={src} alt={label} className="max-h-[420px] w-full max-w-[460px] object-contain" />;
  }
  return (
    <div className="flex aspect-[4/5] w-full max-w-[340px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand/30 bg-white/40 p-6 text-center text-sm font-semibold text-brand/70">
      <Sparkles className="h-7 w-7" aria-hidden />
      <span>Hero illustration</span>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
    </div>
  );
}

/** Single 656px card centred on the page (auth, parent and handover screens). */
export function CenteredCard({ children, width = "max-w-[656px]" }: { children: ReactNode; width?: string }) {
  return <div className={cx("mx-auto my-auto w-full", width)}>{children}</div>;
}
