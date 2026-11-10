import { useState } from "react";
import { useLocation } from "wouter";
import { Lightbulb } from "lucide-react";
import { WizardLayout } from "@/components/Layout";
import { BookCover } from "@/components/BookCover";
import { VoiceTextArea } from "@/components/VoiceTextArea";
import { ArtIcon, StrengthIcon } from "@/components/icons";
import { AssetSlot, Button, Card, Chips, Heading, OptionCard, SectionLabel, StepNav, Subtle, TextInput } from "@/components/ui";
import { DREAM_IDEAS, HEROES, PRONOUNS, STRENGTHS_CREATOR, STRENGTHS_EXPLORER, TOOLS, type HeroType } from "@/data/content";
import { heroArt, heroAvatar, strengthPose, toolPose } from "@/data/assets";
import { useAppState } from "@/state/AppState";
import { cx, possessive } from "@/lib/text";
import { actStart, ROUTES } from "@/lib/routes";

function HeroList({ value, onPick }: { value: HeroType | null; onPick: (h: HeroType) => void }) {
  return (
    <div className="mt-6 space-y-3">
      {HEROES.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => onPick(h.id)}
          aria-pressed={value === h.id}
          className={cx(
            "flex w-full items-center gap-3 rounded-2xl border-[1.5px] bg-tile p-4 text-left sm:p-5",
            value === h.id ? "border-brand" : "border-transparent hover:border-brand/30",
          )}
        >
          <AssetSlot label={`${h.title} avatar`} src={heroAvatar(h.id)} className="h-16 w-16 shrink-0 p-1 text-[9px] sm:h-20 sm:w-20" />
          <span>
            <span className="block text-lg font-bold text-ink">{h.title}</span>
            <span className="text-sm text-ink-muted">{h.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function NameAndPronoun() {
  const { story, updateStory } = useAppState();
  return (
    <>
      <label htmlFor="hero-name" className="mb-2 mt-6 block text-sm font-bold text-ink">
        What would you like to call your hero?
      </label>
      <TextInput
        id="hero-name"
        filled
        placeholder="e.g. Pip"
        value={story.charName}
        onChange={(e) => updateStory({ charName: e.target.value })}
      />
      <p className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-wide text-ink">Which words should the story use for your hero?</p>
      <div className="grid grid-cols-2 gap-3">
        {PRONOUNS.map((p) => (
          <OptionCard
            key={p.id}
            title={p.title}
            desc={p.desc}
            centered
            selected={story.heroPronoun === p.id}
            onClick={() => updateStory({ heroPronoun: p.id })}
          />
        ))}
      </div>
    </>
  );
}

export function HeroScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, mode, heroName } = useAppState();
  const senior = mode === "senior";
  const hero = HEROES.find((h) => h.id === story.heroType);

  return (
    <WizardLayout
      chapter={1}
      progress={senior ? undefined : { total: 2, current: 1 }}
      aside={
        <BookCover
          title={hero ? (senior ? hero.title : heroName) : "Storybook"}
          author={story.authorName || "Author Name"}
          edition={senior ? "Creator" : "Explorer"}
          asset={hero ? `Cover art: ${hero.title}` : undefined}
          assetSrc={hero ? heroAvatar(hero.id) : undefined}
        />
      }
    >
      <Card>
        <Heading>{senior ? "Choose Your Hero" : "Who will go on your adventure?"}</Heading>
        <Subtle className="mt-1">
          {senior ? "Choose a hero, name them, and decide how they enter the story." : "Choose a hero, give them a name, and make the story your own."}
        </Subtle>
        <HeroList value={story.heroType} onPick={(heroType) => updateStory({ heroType })} />
        {senior && <NameAndPronoun />}
        <StepNav
          onBack={() => navigate(ROUTES.style)}
          onNext={() => navigate(senior ? ROUTES.strength : ROUTES.heroName)}
          nextLabel={senior ? "Continue" : "Choose a Hero"}
          nextDisabled={!story.heroType || (senior && !story.heroPronoun)}
        />
      </Card>
    </WizardLayout>
  );
}

export function HeroNameScreen() {
  const [, navigate] = useLocation();
  const { story, heroName } = useAppState();
  const hero = HEROES.find((h) => h.id === story.heroType);

  return (
    <WizardLayout chapter={1} progress={{ total: 2, current: 2 }} asset={`${hero?.title ?? "Hero"}: full body, standing proud`} art={heroArt(story.heroType, "standing")}>
      <Card>
        <Heading>Personalize your hero</Heading>
        <Subtle className="mt-1">Choose how your hero is named and addressed in your story.</Subtle>
        <NameAndPronoun />
        <StepNav
          onBack={() => navigate(ROUTES.hero)}
          backLabel="Back to Hero"
          onNext={() => navigate(ROUTES.strength)}
          nextLabel={`Continue with ${heroName}`}
          nextDisabled={!story.heroPronoun}
        />
      </Card>
    </WizardLayout>
  );
}

function ToolGrid({ onToggle }: { onToggle?: () => void }) {
  const { story, updateStory } = useAppState();
  const toggle = (id: string) => {
    updateStory({ charTools: story.charTools.includes(id) ? story.charTools.filter((t) => t !== id) : [...story.charTools, id] });
    onToggle?.();
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {TOOLS.map((t) => (
        <OptionCard
          key={t.id}
          title={t.title}
          desc={t.desc}
          centered
          icon={<ArtIcon path={`icons/tools/${t.id}.webp`} />}
          selected={story.charTools.includes(t.id)}
          onClick={() => toggle(t.id)}
        />
      ))}
    </div>
  );
}

export function StrengthScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, mode, heroName } = useAppState();
  const senior = mode === "senior";
  const [showTools, setShowTools] = useState(story.charTools.length > 0);
  // Creator picks strength and tools on one screen; the picture follows the last thing tapped.
  const [showToolArt, setShowToolArt] = useState(false);
  const art = showToolArt && story.charTools.length ? toolPose(story.charTools) : strengthPose(story.charStrengths[0]);
  const strengths = senior ? STRENGTHS_CREATOR : STRENGTHS_EXPLORER;

  return (
    <WizardLayout chapter={2} progress={senior ? undefined : { total: 2, current: 1 }} asset={`${heroName}: showing their strength`} art={heroArt(story.heroType, art)}>
      <Card>
        <Heading>{senior ? `What is ${possessive(heroName)} Secret Spark?` : `What makes ${heroName} special on the inside?`}</Heading>
        <Subtle className="mt-1">
          {senior ? "Choose the quiet wonder and helpful tools that light their way." : `Choose a strength that can help ${heroName} through the story.`}
        </Subtle>
        <SectionLabel>{possessive(heroName)} Quiet Wonder</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {strengths.map((s) => (
            <OptionCard
              key={s.id}
              title={s.title}
              desc={s.desc}
              compact
              icon={<StrengthIcon id={s.id} />}
              selected={story.charStrengths[0] === s.id}
              onClick={() => {
                updateStory({ charStrengths: [s.id] });
                setShowToolArt(false);
              }}
            />
          ))}
        </div>
        <SectionLabel>What does {heroName} love most about themselves?</SectionLabel>
        <TextInput placeholder={`${heroName} loves being…`} value={story.selfLove} onChange={(e) => updateStory({ selfLove: e.target.value })} />

        {senior && (
          <>
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Helpful Tools</h2>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                Add tools
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand"
                  checked={showTools}
                  onChange={(e) => {
                    setShowTools(e.target.checked);
                    if (!e.target.checked) updateStory({ charTools: [] });
                  }}
                />
              </label>
            </div>
            {showTools && (
              <div className="mt-3">
                <ToolGrid onToggle={() => setShowToolArt(true)} />
              </div>
            )}
          </>
        )}

        <StepNav
          onBack={() => navigate(senior ? ROUTES.hero : ROUTES.heroName)}
          onNext={() => navigate(senior ? ROUTES.dream : ROUTES.tools)}
          nextLabel={senior ? "Continue" : "Continue to Helpful Tools"}
          nextDisabled={!story.charStrengths.length}
        />
      </Card>
    </WizardLayout>
  );
}

export function ToolsScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, heroName } = useAppState();

  return (
    <WizardLayout chapter={2} progress={{ total: 2, current: 2 }} asset={`${heroName}: wearing the chosen tool(s)`} art={heroArt(story.heroType, toolPose(story.charTools))}>
      <Card>
        <Heading>Does {heroName} use any helpful tools?</Heading>
        <Subtle className="mt-1">Pick any tools that help, or continue without choosing one.</Subtle>
        <SectionLabel>Helpful Tools</SectionLabel>
        <ToolGrid />
        <StepNav
          onBack={() => navigate(ROUTES.strength)}
          onNext={() => navigate(ROUTES.dream)}
          nextLabel="Continue to My Dream"
          extra={
            <Button
              variant="ghost"
              onClick={() => {
                updateStory({ charTools: [] });
                navigate(ROUTES.dream);
              }}
            >
              None for this story
            </Button>
          }
        />
      </Card>
    </WizardLayout>
  );
}

export function DreamScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, mode, heroName } = useAppState();
  const senior = mode === "senior";

  return (
    <WizardLayout chapter={3} asset={story.aspiration ? `${heroName}: living the dream — “${story.aspiration}”` : `${heroName}: thinking about a dream`}
      art={heroArt(story.heroType, story.aspiration ? "dream" : "standing")}
    >
      <Card>
        <Heading>What does {heroName} dream of doing?</Heading>
        {senior && <Subtle className="mt-1">Give your hero a goal, ambition, or purpose that drives the story forward.</Subtle>}
        <div className="mt-5">
          <VoiceTextArea
            id="aspiration"
            value={story.aspiration}
            onChange={(aspiration) => updateStory({ aspiration })}
            placeholder={`${heroName} dreams of…`}
          />
        </div>
        {senior ? (
          <Chips items={DREAM_IDEAS} active={story.aspiration} onPick={(aspiration) => updateStory({ aspiration })} />
        ) : (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand/40"
            onClick={() => updateStory({ aspiration: DREAM_IDEAS[Math.floor(Math.random() * DREAM_IDEAS.length)] })}
          >
            <Lightbulb className="h-3.5 w-3.5" aria-hidden /> Give me an idea
          </button>
        )}
        <StepNav
          onBack={() => navigate(senior ? ROUTES.strength : ROUTES.tools)}
          onNext={() => navigate(actStart(1, mode))}
          nextDisabled={!story.aspiration.trim()}
        />
      </Card>
    </WizardLayout>
  );
}
