import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Circle, Loader2, Pencil, Sparkles } from "lucide-react";
import { AppShell, CenteredCard } from "@/components/Layout";
import { BookCover } from "@/components/BookCover";
import { Flipbook } from "@/components/Flipbook";
import { pageText } from "@/data/storyText";
import { Arrow, Button, Card, Heading, LinkButton, Subtle } from "@/components/ui";
import { heroAvatar } from "@/data/assets";
import { useAppState } from "@/state/AppState";
import { possessive } from "@/lib/text";
import { ROUTES } from "@/lib/routes";

const PAGES = 15;

/** Generation stages; each runs until progress reaches `until` (%). */
const GEN_STEPS: { label: string; until: number; status: (page: number) => string }[] = [
  { label: "Reading your choices", until: 12, status: () => "Gathering your hero, feelings and brave moves…" },
  { label: "Writing the story", until: 52, status: (p) => `Writing page ${p} of ${PAGES}…` },
  { label: "Creating the pictures", until: 92, status: (p) => `Illustrating page ${p} of ${PAGES}…` },
  { label: "Putting your book together", until: 100, status: () => "Binding the pages…" },
];

// No generation backend: this screen only animates, then moves on.
// When a real backend exists, drive `progress` from its updates instead of the timer.
export function GeneratingScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory } = useAppState();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setProgress((p) => Math.min(p + 4, 100)), 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress < 100) return;
    updateStory({ storyGeneratedAt: new Date().toISOString() });
    navigate(ROUTES.ready);
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const book = story.selectedFormat === "comic" ? "Comic Book" : "Storybook";
  const current = GEN_STEPS.findIndex((s) => progress < s.until);
  const active = current === -1 ? GEN_STEPS.length - 1 : current;
  const step = GEN_STEPS[active];
  // Page count within the active stage, so "page X of 15" restarts for the pictures.
  const from = active === 0 ? 0 : GEN_STEPS[active - 1].until;
  const page = Math.min(PAGES, Math.max(1, Math.ceil(((progress - from) / (step.until - from)) * PAGES)));
  const status = step.status(page);

  return (
    <AppShell>
      <CenteredCard width="max-w-[480px]">
        <Card className="w-full p-0 text-center sm:p-0">
          <div className="px-8 pb-6 pt-8">
            <Sparkles className="mx-auto h-12 w-12 text-brand" aria-hidden />
            <h1 className="mt-5 text-base font-bold text-ink">Your Story Is Coming to Life</h1>
            <Subtle className="mt-1">We're writing the story and creating its pictures.</Subtle>
            {/* Live checklist: each stage is waiting, in progress (spinner) or done. */}
            <ol className="mx-auto mt-6 w-fit space-y-2.5 text-left text-sm">
              {GEN_STEPS.map((s, i) => {
                const done = progress >= s.until;
                const running = !done && i === active;
                return (
                  <li key={s.label} className="flex items-center gap-2.5">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    ) : running ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" aria-hidden />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                    )}
                    <span className={done ? "text-ink" : running ? "font-bold text-ink" : "text-ink-faint"}>{s.label}</span>
                    <span className="sr-only">{done ? "(done)" : running ? "(in progress)" : "(waiting)"}</span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 flex justify-between gap-4 text-xs text-ink">
              {/* Announced to screen readers as it changes. */}
              <span role="status" aria-live="polite" className="text-left">
                {book}: {status}
              </span>
              <span className="font-bold tabular-nums">{progress}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-tile"
              role="progressbar"
              aria-label={`Creating your ${book.toLowerCase()}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className="h-full rounded-full bg-brand/70 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="border-t border-ink/10 py-4">
            <LinkButton href={ROUTES.start} variant="outline">
              Finish Later
            </LinkButton>
          </div>
        </Card>
      </CenteredCard>
    </AppShell>
  );
}

export function ReadyScreen() {
  const { story, mode, heroName } = useAppState();
  return (
    <AppShell>
      <div className="my-auto flex flex-col items-center text-center">
        <Heading>Your Story Is Ready</Heading>
        <BookCover
          className="mt-8"
          title={`${possessive(heroName)} Magical Journey`}
          author={story.authorName || "Author Name"}
          edition={mode === "senior" ? "Creator" : "Explorer"}
          asset="Cover art: hero portrait"
          assetSrc={story.heroType ? heroAvatar(story.heroType) : undefined}
        />
        <LinkButton href={ROUTES.book} className="mt-8">
          Open My Story <Arrow />
        </LinkButton>
      </div>
    </AppShell>
  );
}

export function BookScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, heroName } = useAppState();
  const [editing, setEditing] = useState(false);
  const [at, setAt] = useState<{ part: number | null; atEnd: boolean }>({ part: null, atEnd: false });
  // Child's inline edits, per page. Kept locally until there is an API to save them.
  const [edits, setEdits] = useState<Record<number, string>>({});

  return (
    <AppShell>
      <div className="my-auto flex w-full flex-col items-center">
        <Heading className="text-center">Your Story Is Ready</Heading>
        <Subtle className="mb-8 mt-1 text-center">Open the cover and turn the pages of {possessive(heroName)} adventure.</Subtle>
        <Flipbook
          textFor={(p) => edits[p] ?? pageText(p, story, heroName)}
          editing={editing}
          onTextChange={(p, v) => setEdits((e) => ({ ...e, [p]: v }))}
          onPositionChange={setAt}
          endAction={
            <Button
              className="h-11 shrink-0 px-5"
              onClick={() => {
                updateStory({ confirmedByChild: true });
                navigate(ROUTES.done);
              }}
            >
              I'm Done! <Arrow />
            </Button>
          }
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => setEditing(!editing)}>
            <Pencil className="h-4 w-4" /> {editing ? "Save Changes" : "Edit My Story"}
          </Button>
        </div>
        <Subtle className="mt-3 text-center text-xs">
          {editing && at.part === null
            ? "Turn to a story page to change its words."
            : at.atEnd
              ? "Tap “I'm Done!” when your story is finished."
              : "Read to the last page and tap “I'm Done!” when your story is finished."}
        </Subtle>
      </div>
    </AppShell>
  );
}

export function DoneScreen() {
  return (
    <AppShell>
      <CenteredCard width="max-w-[656px]">
        <Card className="w-full text-center">
          <Heading>Your Story Is Ready!</Heading>
          <Subtle className="mx-auto mt-2 max-w-xs">
            Your adventure is ready to share. Ask your parent to review your story and help you get your book.
          </Subtle>
          <div className="mt-6">
            <LinkButton href={ROUTES.review}>
              Ask a Parent to Continue <Arrow />
            </LinkButton>
          </div>
        </Card>
      </CenteredCard>
    </AppShell>
  );
}
