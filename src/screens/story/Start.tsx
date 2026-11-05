import { Link, useLocation } from "wouter";
import { BookOpen, Wand2 } from "lucide-react";
import { AppShell } from "@/components/Layout";
import { Arrow, Button, Card, LinkButton, Subtle } from "@/components/ui";
import { HEROES } from "@/data/content";
import { useAppState, type StoryState } from "@/state/AppState";
import { possessive } from "@/lib/text";
import { actStart, ROUTES } from "@/lib/routes";
import type { Mode } from "@/state/AppState";

/** Where to resume an unfinished draft, and how far along it is. */
export function resumePoint(story: StoryState, mode: Mode): { href: string; chapter: number } {
  if (story.storyGeneratedAt) return { href: ROUTES.book, chapter: 7 };
  if (story.facesChallenge3 !== null) return { href: actStart(3, mode), chapter: 7 };
  if (story.obstacles2.length) return { href: ROUTES.gate, chapter: 6 };
  if (story.safePlaceText) return { href: actStart(2, mode), chapter: 5 };
  if (story.obstacles.length) return { href: ROUTES.rest, chapter: 4 };
  if (story.aspiration) return { href: actStart(1, mode), chapter: 3 };
  if (story.charStrengths.length) return { href: ROUTES.dream, chapter: 2 };
  return { href: ROUTES.hero, chapter: 1 };
}

function DraftCard() {
  const { story, mode, heroName } = useAppState();
  if (!story.heroType) return null;
  const { href, chapter } = resumePoint(story, mode);
  const hero = HEROES.find((h) => h.id === story.heroType);

  return (
    <Card className="flex flex-col p-5 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
          Chapter {chapter} of 7 • In Progress
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-ink">{possessive(heroName)} Magical Journey</h3>
      <Subtle className="mt-2 flex-1 text-xs">
        {hero?.title}
        {story.aspiration && ` who dreams to ${story.aspiration.toLowerCase()}`}.
      </Subtle>
      <div className="mt-4 flex justify-end border-t border-ink/10 pt-4">
        <LinkButton href={href} className="h-9 px-4">
          Continue My Story <Arrow />
        </LinkButton>
      </div>
    </Card>
  );
}

export function StartScreen() {
  const [, navigate] = useLocation();
  const { story, resetStory, mode } = useAppState();

  return (
    <AppShell
      right={
        <LinkButton href={ROUTES.library} className="h-9 px-4">
          <BookOpen className="h-4 w-4" /> Story Library
        </LinkButton>
      }
    >
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="rounded-md border border-brand/50 px-3 py-1 text-[11px] font-bold tracking-widest text-brand">
          INTERACTIVE STORY STUDIO FOR YOUNG AUTHORS
        </span>
        <h1 className="mt-8 font-display text-5xl font-medium leading-[0.95] tracking-[-0.03em] text-ink sm:text-[80px]">
          Create a Story <br />
          That's <span className="text-brand">Yours</span>
        </h1>
        <p className="mt-6 text-ink">
          {mode === "senior"
            ? "Choose a hero, shape their dream, and build a story that sounds like you."
            : "Choose a hero, give them a dream, and help them find a way through something difficult."}
        </p>
        <Button
          className="mt-7"
          onClick={() => {
            resetStory();
            navigate(ROUTES.author);
          }}
        >
          <Wand2 className="h-4 w-4" /> Start a New Story <Arrow />
        </Button>
      </section>

      {story.heroType && (
        <section className="mx-auto mt-14 w-full max-w-[1000px] text-center">
          <h2 className="font-display text-2xl font-bold text-ink">Continue an Existing Story</h2>
          <Subtle className="mt-1">Jump back into a story in progress.</Subtle>
          <div className="mx-auto mt-6 grid max-w-[496px] text-left">
            <DraftCard />
          </div>
        </section>
      )}

      <p className="mt-auto pt-12 text-center text-xs text-ink-muted">
        Grown-up?{" "}
        <Link href={ROUTES.dashboard} className="font-bold underline">
          Parent area
        </Link>
      </p>
    </AppShell>
  );
}

export function LibraryScreen() {
  const { story } = useAppState();
  return (
    <AppShell right={<LinkButton href={ROUTES.start} variant="outline">← Home</LinkButton>}>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink">Story Library</h1>
      <Subtle className="mt-1">Every story you've started or finished lives here.</Subtle>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {story.heroType ? (
          <DraftCard />
        ) : (
          <Card className="col-span-full text-center">
            <p className="font-display text-xl text-ink">No stories yet</p>
            <Subtle className="mt-1">Start a new story and it will show up here.</Subtle>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
