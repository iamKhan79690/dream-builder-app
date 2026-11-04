import { ArrowLeft, Feather } from "lucide-react";
import { PANEL_LABELS } from "@/data/content";
import { asset, feelingPose, heroArt, movePose, strengthPose, toolPose } from "@/data/assets";
import { pageQuote } from "@/data/storyText";
import { useAppState, type StoryState } from "@/state/AppState";
import { cx } from "@/lib/text";
import { Arrow, AssetSlot, Button } from "./ui";

export const PAGE_COUNT = PANEL_LABELS.length;


/**
 * Picture for a page. The panels/ scenes illustrate the sample knight story
 * (BOOK_SAMPLE.md), so only a knight's book uses them; until the story
 * generator exists, other pages reuse the artwork for the child's own choices
 * in that part of the story (Glossary §2 panel order).
 */
function pageArt(page: number, story: StoryState): { src?: string; scene: boolean } {
  const panel = story.heroType === "knight" ? asset(`panels/panel-${String(page).padStart(2, "0")}.webp`) : undefined;
  if (panel) return { src: panel, scene: true };
  const hero = (pose: Parameters<typeof heroArt>[1]) => heroArt(story.heroType, pose);
  const obstacle = (ids: string[]) => (ids[0] ? asset(`obstacles/${ids[0]}.webp`) : undefined);
  const byPage: Record<number, string | undefined> = {
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

export function BookSpread({
  page,
  text,
  author,
  editing,
  onTextChange,
}: {
  page: number;
  text: string;
  author: string;
  editing?: boolean;
  onTextChange?: (v: string) => void;
}) {
  const { story } = useAppState();
  const art = pageArt(page, story);
  const quote = pageQuote(page, story);
  return (
    <div className="mx-auto w-full max-w-[880px] rounded-md bg-[#4A33B8] p-2.5 shadow-[0_24px_50px_-20px_rgba(40,20,120,0.55)] sm:pl-5">
      <div className="grid min-h-[30rem] overflow-hidden rounded-sm bg-white sm:grid-cols-2">
        <div className="hidden bg-gradient-to-r from-white via-white to-zinc-200/80 sm:block" aria-hidden />
        <div className="flex flex-col bg-[#FCFBF8] p-5 shadow-[inset_8px_0_12px_-8px_rgba(0,0,0,0.15)]">
          <AssetSlot
            label={`Panel ${page} illustration — ${PANEL_LABELS[page - 1]}`}
            src={art.src}
            cover={art.scene}
            className={cx(
              "aspect-[2/1] rounded-md",
              // Character art has a transparent background, so give it a soft storybook backdrop.
              !art.scene && "bg-gradient-to-b from-[#EAF4FB] to-[#F4EEDC] p-3",
            )}
          />
          {editing ? (
            <textarea
              value={text}
              onChange={(e) => onTextChange?.(e.target.value)}
              className="mt-4 flex-1 resize-none rounded-md border border-brand/40 p-2 font-display text-sm leading-relaxed text-ink focus:outline-none"
              aria-label={`Edit page ${page} text`}
            />
          ) : (
            <p className="mt-4 text-justify font-display text-sm leading-relaxed text-ink first-letter:float-left first-letter:mr-1.5 first-letter:text-[44px] first-letter:font-bold first-letter:leading-[0.9] first-letter:text-amber-800">
              {text}
            </p>
          )}
          {quote && !editing && (
            <p className="mt-4 rounded-r-md border-l-2 border-amber-500 bg-amber-50 px-3 py-2 font-display text-xs italic text-amber-900">{quote}</p>
          )}
          <span className="flex-1" />
          <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-2 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <Feather className="h-3 w-3 text-amber-700" /> Inscribed by <b className="text-ink">{author}</b>
            </span>
            <b className="font-display text-ink">{String(page).padStart(2, "0")}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageNav({
  page,
  onChange,
  onFinish,
}: {
  page: number;
  onChange: (p: number) => void;
  /** Shown instead of "Next Page" on the last page. */
  onFinish?: () => void;
}) {
  const last = page === PAGE_COUNT;
  return (
    <div className="mx-auto mt-6 flex w-full max-w-[880px] items-center justify-between">
      <Button variant="outline" className="h-9 px-4" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </Button>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-brand">
          {String(page).padStart(2, "0")}/{PAGE_COUNT}
        </span>
        {last && onFinish ? (
          <Button className="h-9 px-4" onClick={onFinish}>
            I'm Done! <Arrow />
          </Button>
        ) : (
          <Button className="h-9 px-4" disabled={last} onClick={() => onChange(page + 1)}>
            Next Page <Arrow />
          </Button>
        )}
      </div>
    </div>
  );
}
