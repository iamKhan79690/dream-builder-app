import { useState } from "react";
import { Link } from "wouter";
import { Archive, Pencil, X } from "lucide-react";
import { BRAVE_MOVES, FEELINGS, FEELINGS_CREATOR_FINAL, HEROES, OBSTACLES, PRONOUNS, STRENGTHS_CREATOR, STRENGTHS_EXPLORER, TOOLS, type Act } from "@/data/content";
import { useAppState } from "@/state/AppState";
import { actStart, ROUTES } from "@/lib/routes";

const titleOf = (list: { id: string; title: string }[], id?: string) => list.find((o) => o.id === id)?.title;

/** Docked summary of the child's choices so far, with jump-back edit links. */
export function MemoryBox() {
  const { story, mode } = useAppState();
  const [open, setOpen] = useState(false);

  const strengths = [...STRENGTHS_EXPLORER, ...STRENGTHS_CREATOR];
  const feelings = [...FEELINGS, ...FEELINGS_CREATOR_FINAL];

  const act = (n: Act, obstacle: string[], feeling: string, move: string) =>
    [titleOf(OBSTACLES[n], obstacle[0]), titleOf(feelings, feeling), titleOf(BRAVE_MOVES[n], move)].filter(Boolean).join(" / ");

  const entries = [
    {
      label: "Chapter 1 · Hero",
      value: story.heroType
        ? titleOf(HEROES, story.heroType) + (story.heroPronoun ? ` (${PRONOUNS.find((p) => p.id === story.heroPronoun)?.desc})` : "")
        : "",
      href: ROUTES.hero,
    },
    {
      label: "Chapter 2 · Strength",
      value: [titleOf(strengths, story.charStrengths[0]), ...story.charTools.map((t) => titleOf(TOOLS, t))]
        .filter(Boolean)
        .join(" / "),
      href: ROUTES.strength,
    },
    { label: "Chapter 3 · Dream", value: story.aspiration, href: ROUTES.dream },
    { label: "Chapter 4 · Challenge", value: act(1, story.obstacles, story.heartColor, story.braveMove), href: actStart(1, mode) },
    { label: "Chapter 5 · Rest & Restore", value: story.safePlaceText, href: ROUTES.rest },
    { label: "Chapter 6 · The Return", value: act(2, story.obstacles2, story.heartColor2, story.braveMove2), href: actStart(2, mode) },
    { label: "The Final Act", value: act(3, story.obstacles3, story.heartColor3, story.braveMove3), href: actStart(3, mode) },
  ].filter((e) => e.value);

  if (entries.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-1.5 rounded-l-full bg-brand py-2 pl-3 pr-4 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-card hover:bg-brand-dark"
      >
        <Archive className="h-3.5 w-3.5" aria-hidden /> Memory Box ({entries.length})
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/30" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-full max-w-sm overflow-y-auto bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
            aria-label="Story Memory Box"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Story Memory Box</h2>
                <p className="text-xs text-ink-muted">Your story choices so far</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-ink" />
              </button>
            </div>
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.label} className="rounded-xl border border-ink/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{e.label}</span>
                    <Link href={e.href} className="flex items-center gap-1 text-xs font-bold text-brand" onClick={() => setOpen(false)}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-ink">{e.value}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
