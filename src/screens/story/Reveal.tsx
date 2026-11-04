import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Mic, Pencil, Sparkles } from "lucide-react";
import { AppShell, CenteredCard } from "@/components/Layout";
import { BookCover } from "@/components/BookCover";
import { BookSpread, PageNav } from "@/components/BookSpread";
import { pageText } from "@/data/storyText";
import { Arrow, Button, Card, Heading, LinkButton, Subtle } from "@/components/ui";
import { heroAvatar } from "@/data/assets";
import { useAppState } from "@/state/AppState";
import { possessive } from "@/lib/text";
import { ROUTES } from "@/lib/routes";

// No generation backend: this screen only animates, then moves on.
export function GeneratingScreen() {
  const [, navigate] = useLocation();
  const { updateStory } = useAppState();
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

  const page = Math.max(1, Math.ceil((progress / 100) * 15));

  return (
    <AppShell>
      <CenteredCard width="max-w-[480px]">
        <Card className="w-full p-0 text-center sm:p-0">
          <div className="px-8 pb-6 pt-8">
            <Sparkles className="mx-auto h-12 w-12 text-brand" aria-hidden />
            <h1 className="mt-5 text-base font-bold text-ink">Your Story Is Coming to Life</h1>
            <Subtle className="mt-1">We're writing the story and creating its pictures.</Subtle>
            <ul className="mt-4 space-y-1 text-sm text-ink-muted">
              <li className="flex items-center justify-center gap-2">
                <CheckCircle2 className={progress >= 40 ? "h-4 w-4 text-emerald-500" : "h-4 w-4 text-ink-faint"} /> Writing the story
              </li>
              <li className="flex items-center justify-center gap-2">
                <CheckCircle2 className={progress >= 100 ? "h-4 w-4 text-emerald-500" : "h-4 w-4 text-ink-faint"} /> Creating the pictures
              </li>
            </ul>
            <div className="mt-6 flex justify-between text-xs text-ink">
              <span>Storybook: Creating page {page} of 15</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-tile">
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
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);
  // Child's inline edits, per page. Kept locally until there is an API to save them.
  const [edits, setEdits] = useState<Record<number, string>>({});

  return (
    <AppShell>
      <div className="my-auto flex flex-col items-center">
        <Heading className="mb-8">Your Story Is Ready</Heading>
        <BookSpread
          page={page}
          author={story.authorName || "Author Name"}
          text={edits[page] ?? pageText(page, story, heroName)}
          editing={editing}
          onTextChange={(v) => setEdits({ ...edits, [page]: v })}
        />
        <PageNav
          page={page}
          onChange={setPage}
          onFinish={() => {
            updateStory({ confirmedByChild: true });
            navigate(ROUTES.done);
          }}
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" className="border-ink/10 shadow-sm" onClick={() => setRecording(!recording)}>
            <Mic className="h-4 w-4 text-brand" /> {recording ? "Stop Recording" : "Record My Voice"}
          </Button>
          <Button onClick={() => setEditing(!editing)}>
            <Pencil className="h-4 w-4" /> {editing ? "Save Changes" : "Edit My Story"}
          </Button>
        </div>
        <Subtle className="mt-3 text-xs">Read to the last page and tap “I'm Done!” when your story is finished.</Subtle>
        {recording && <p className="mt-3 text-sm font-semibold text-brand">{heroName} is listening… 🎙️</p>}
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
