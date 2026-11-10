import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { AppShell, WizardLayout } from "@/components/Layout";
import { BookCover } from "@/components/BookCover";
import { Arrow, Button, Card, Heading, OptionCard, StepNav, Subtle, TextInput } from "@/components/ui";
import { ART_STYLES } from "@/data/content";
import { asset } from "@/data/assets";
import { useAppState } from "@/state/AppState";
import { ROUTES } from "@/lib/routes";

export function AuthorScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, mode, activeChild } = useAppState();
  const senior = mode === "senior";

  return (
    <WizardLayout
      chapter={{ label: "Step 0: Author Profile" }}
      aside={<BookCover title="Storybook" author={story.authorName || "Author Name"} edition={senior ? "Creator" : "Explorer"} />}
    >
      <Card>
        <Heading>{senior ? "Start Your Story" : "Let's Start With You"}</Heading>
        <Subtle className="mt-1">Your name will appear in the finished {senior ? "book" : "story"}.</Subtle>
        <label htmlFor="author" className="mb-2 mt-6 block text-sm font-bold text-ink">
          What's your name?
        </label>
        <TextInput
          id="author"
          filled
          placeholder={`e.g. ${activeChild?.name ?? "Maya"}`}
          value={story.authorName}
          onChange={(e) => updateStory({ authorName: e.target.value })}
          onEnter={() => story.authorName.trim() && navigate(ROUTES.format)}
        />
        <Button className="mt-6 w-full" disabled={!story.authorName.trim()} onClick={() => navigate(ROUTES.format)}>
          Start My Story <Arrow />
        </Button>
      </Card>
    </WizardLayout>
  );
}

function CenteredStep({ children }: { children: ReactNode }) {
  return (
    <AppShell tone="calm">
      <div className="mx-auto my-auto w-full max-w-[656px]">{children}</div>
    </AppShell>
  );
}

/** "Next" button label on the format and style steps, named after the chosen format. */
function createLabel(format: string | null | undefined): string {
  if (format === "comic") return "Create My Comic Book";
  if (format === "storybook") return "Create My Storybook";
  return "Create My Book";
}

export function FormatScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory } = useAppState();

  return (
    <CenteredStep>
      <Card>
        <Heading>Choose Your Format</Heading>
        <Subtle className="mt-1">How would you like your story to look?</Subtle>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <OptionCard
            title="Classic Storybook"
            desc="Full pages of prose with one illustration on each page."
            selected={story.selectedFormat === "storybook"}
            onClick={() => updateStory({ selectedFormat: "storybook" })}
            asset="Format preview: storybook page"
            assetSrc={asset("formats/storybook.webp")}
            coverArt
            className="min-h-64"
          />
          <OptionCard
            title="Comic Book"
            desc="Four-panel pages with captions and speech bubbles."
            selected={story.selectedFormat === "comic"}
            onClick={() => updateStory({ selectedFormat: "comic" })}
            asset="Format preview: 4-panel comic page"
            assetSrc={asset("formats/comic.webp")}
            coverArt
            className="min-h-64"
          />
        </div>
        <StepNav
          onBack={() => navigate(ROUTES.author)}
          onNext={() => navigate(ROUTES.style)}
          nextLabel={createLabel(story.selectedFormat)}
          nextDisabled={!story.selectedFormat}
        />
      </Card>
    </CenteredStep>
  );
}

export function StyleScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory } = useAppState();
  const comic = story.selectedFormat === "comic";

  return (
    <CenteredStep>
      <Card>
        <Heading>{comic ? "How would you like your comic to look?" : "How should your story look?"}</Heading>
        <p className="mt-1 text-sm font-bold text-ink">Choose the art style for your adventure.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {ART_STYLES.map((s, i) => (
            <OptionCard
              key={s.id}
              title={s.title}
              desc={s.desc}
              selected={story.comicVibe === s.id}
              onClick={() => updateStory({ comicVibe: s.id })}
              asset={`Style sample: ${s.title}${comic ? " (comic)" : ""}`}
              assetSrc={asset(`styles/${comic ? "comic" : "storybook"}/${s.id}.webp`)}
              coverArt
              className={i === ART_STYLES.length - 1 ? "col-span-2 min-h-72" : "min-h-52"}
            />
          ))}
        </div>
        <StepNav
          onBack={() => navigate(ROUTES.format)}
          onNext={() => navigate(ROUTES.hero)}
          nextLabel={createLabel(story.selectedFormat)}
          nextDisabled={!story.comicVibe}
        />
      </Card>
    </CenteredStep>
  );
}
