import { useState } from "react";
import { Redirect, useLocation, useParams } from "wouter";
import { AppShell, chapterLabel, WizardLayout } from "@/components/Layout";
import { VoiceTextArea } from "@/components/VoiceTextArea";
import { ArtIcon, MoveIcon } from "@/components/icons";
import { Arrow, AssetSlot, Button, Card, ChapterPill, Chips, Heading, OptionCard, SectionLabel, StepNav, Subtle, TextInput } from "@/components/ui";
import {
  BRAVE_MOVES,
  FEELINGS,
  FEELINGS_CREATOR_FINAL,
  HERO_WORDS_PLACEHOLDER,
  OBSTACLES,
  REST_IDEAS,
  type Act,
} from "@/data/content";
import { asset, feelingPose, heroArt, movePose } from "@/data/assets";
import { useAppState, type StoryState } from "@/state/AppState";
import { fill, possessive } from "@/lib/text";
import { actStart, ROUTES, type ActPart } from "@/lib/routes";

// Per-act StoryState keys (PRD: obstacles / obstacles2 / obstacles3, etc.).
const KEYS = {
  1: { obstacle: "obstacles", feeling: "heartColor", move: "braveMove", words: "heroWords" },
  2: { obstacle: "obstacles2", feeling: "heartColor2", move: "braveMove2", words: "heroWords2" },
  3: { obstacle: "obstacles3", feeling: "heartColor3", move: "braveMove3", words: "heroWords3" },
} as const satisfies Record<Act, Record<string, keyof StoryState>>;

const CHAPTER: Record<Act, number | "final"> = { 1: 4, 2: 6, 3: "final" };

function copy(act: Act, hero: string) {
  const s = possessive(hero);
  return {
    obstacle: {
      1: { title: `What stands in ${s} way?`, sub: `Choose what appears as ${hero} follows the dream.` },
      2: { title: "Another challenge appears", sub: `${hero} has rested and remembers what helped before. What appears in the path now?` },
      3: { title: `What is the last thing standing in ${s} way?`, sub: `Choose what appears before ${hero} can reach the dream.` },
    }[act],
    creatorTitle: {
      1: { title: `What stands between ${hero} and the dream?`, sub: "Choose an obstacle, define how your hero feels, and decide how they will respond." },
      2: { title: "Another obstacle takes shape", sub: "Your hero has gathered strength, but the challenge returns. What is making the path difficult this time?" },
      3: { title: "What final obstacle takes shape?", sub: `Choose what stands between ${hero} and the dream at this point in the journey.` },
    }[act],
    feeling: {
      1: { title: `How does ${hero} feel?`, sub: "Choose the feeling that fits when the challenge appears." },
      2: { title: `How does ${hero} feel this time?`, sub: "The feeling may be the same, or it may have changed." },
      3: { title: `How does ${hero} feel now?`, sub: "The feeling may be the same, or it may have changed." },
    }[act],
    move: {
      1: { title: `What could help ${hero} try?`, sub: "Choose one way to begin. It may take more than one try.", words: `What will ${hero} say before trying?` },
      2: { title: `What could help ${hero} try again?`, sub: `Choose what ${hero} will try next. It may take time before anything changes.`, words: `What will ${hero} say this time?` },
      3: { title: `What could help ${hero} keep going?`, sub: `What will ${hero} say before trying once more?`, words: `What will ${hero} say before trying once more?` },
    }[act],
  };
}

export function ActScreen() {
  const params = useParams<{ act: string; part: ActPart }>();
  const [, navigate] = useLocation();
  const { story, updateStory, mode, heroName } = useAppState();
  // Creator picks all three on one screen; the picture follows the last section tapped in this act.
  const [tapped, setTapped] = useState<{ act: number; part: "obstacle" | "feeling" | "move" }>();

  const act = Number(params.act) as Act;
  const part = params.part;
  if (![1, 2, 3].includes(act) || !["obstacle", "feeling", "move", "all"].includes(part)) {
    return <Redirect to={ROUTES.start} />;
  }

  const keys = KEYS[act];
  const text = copy(act, heroName);
  const senior = mode === "senior";
  const feelings = senior && act === 3 ? FEELINGS_CREATOR_FINAL : FEELINGS;

  const obstacleId = (story[keys.obstacle] as string[])[0];
  const feelingId = story[keys.feeling] as string;
  const moveId = story[keys.move] as string;
  const words = story[keys.words] as string;

  const obstacleTitle = OBSTACLES[act].find((o) => o.id === obstacleId)?.title;
  const feelingTitle = feelings.find((f) => f.id === feelingId)?.title;
  const moveTitle = BRAVE_MOVES[act].find((m) => m.id === moveId)?.title;

  const afterAct = act === 1 ? ROUTES.rest : act === 2 ? ROUTES.gate : ROUTES.generating;
  const beforeAct = act === 1 ? ROUTES.dream : act === 2 ? ROUTES.rest : ROUTES.gate;
  const base = `/story/act/${act}`;

  const obstacleGrid = (
    <div className="grid grid-cols-2 gap-3">
      {OBSTACLES[act].map((o) => (
        <OptionCard
          key={o.id}
          title={o.title}
          desc={fill(o.desc, heroName)}
          asset={`Obstacle art: ${o.title}`}
          assetSrc={asset(`obstacles/${o.id}.webp`)}
          selected={obstacleId === o.id}
          onClick={() => {
            updateStory({ [keys.obstacle]: [o.id] });
            setTapped({ act, part: "obstacle" });
          }}
          className="min-h-[250px] sm:min-h-[306px]"
        />
      ))}
    </div>
  );

  const feelingGrid = (
    <div className={senior && act === 3 ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "grid grid-cols-3 gap-2"}>
      {feelings.map((f) => (
        <OptionCard
          key={f.id}
          title={f.title}
          desc={f.desc}
          centered
          icon={<ArtIcon path={`icons/feelings/${f.id}.webp`} />}
          selected={feelingId === f.id}
          onClick={() => {
            updateStory({ [keys.feeling]: f.id });
            setTapped({ act, part: "feeling" });
          }}
        />
      ))}
    </div>
  );

  const moveGrid = (
    <div className="grid gap-3 sm:grid-cols-2">
      {BRAVE_MOVES[act].map((m) => (
        <OptionCard
          key={m.id}
          title={m.title}
          desc={m.desc}
          icon={<MoveIcon id={m.id} />}
          selected={moveId === m.id}
          onClick={() => {
            updateStory({ [keys.move]: m.id });
            setTapped({ act, part: "move" });
          }}
        />
      ))}
    </div>
  );

  const wordsInput = (label: string) => (
    <>
      <SectionLabel>{label}</SectionLabel>
      <TextInput
        placeholder={HERO_WORDS_PLACEHOLDER[act]}
        value={words}
        onChange={(e) => updateStory({ [keys.words]: e.target.value })}
      />
    </>
  );

  if (part === "all") {
    const last = tapped?.act === act ? tapped.part : "obstacle";
    const pose =
      last === "feeling" ? feelingPose(act, feelingId) : last === "move" ? movePose(act, moveId) : obstacleId ? `obstacle-${obstacleId}` as const : "standing";
    const label =
      last === "feeling" ? `${heroName} feeling ${feelingTitle ?? "…"}` : last === "move" ? `${heroName}: ${moveTitle ?? "brave move"} pose` : `${heroName} facing ${obstacleTitle ?? "the challenge"}`;
    return (
      <WizardLayout chapter={CHAPTER[act]} asset={label} art={heroArt(story.heroType, pose)}>
        <Card>
          <Heading>{text.creatorTitle.title}</Heading>
          <Subtle className="mt-1">{text.creatorTitle.sub}</Subtle>
          <SectionLabel>{possessive(heroName)} Challenge</SectionLabel>
          {obstacleGrid}
          <SectionLabel>{act === 1 ? `${possessive(heroName)} feelings` : act === 2 ? `What does ${heroName} feel this time?` : `What comes up for ${heroName} now?`}</SectionLabel>
          {feelingGrid}
          <SectionLabel>{act === 1 ? `What will ${heroName} try first?` : act === 2 ? `${possessive(heroName)} way forward` : `How will ${heroName} respond?`}</SectionLabel>
          {moveGrid}
          {wordsInput(act === 3 ? `What does ${heroName} say before the final attempt?` : text.move.words)}
          <StepNav
            onBack={() => navigate(beforeAct)}
            onNext={() => navigate(afterAct)}
            nextDisabled={!obstacleId || !feelingId || !moveId || !words.trim()}
          />
        </Card>
      </WizardLayout>
    );
  }

  const step = { obstacle: 1, feeling: 2, move: 3 }[part];
  const screens = {
    obstacle: {
      title: text.obstacle.title,
      sub: text.obstacle.sub,
      body: (
        <>
          {act === 2 && <SectionLabel>What's blocking {heroName}?</SectionLabel>}
          {obstacleGrid}
        </>
      ),
      ready: !!obstacleId,
      asset: obstacleTitle ? `${heroName} reacting to ${obstacleTitle}` : `${heroName} on the path`,
      art: heroArt(story.heroType, obstacleId ? `obstacle-${obstacleId}` : "standing"),
      back: beforeAct,
      next: `${base}/feeling`,
    },
    feeling: {
      title: text.feeling.title,
      sub: text.feeling.sub,
      body: (
        <>
          <SectionLabel>{text.feeling.title}</SectionLabel>
          {feelingGrid}
        </>
      ),
      ready: !!feelingId,
      asset: `${heroName} feeling ${feelingTitle ?? "…"}`,
      art: heroArt(story.heroType, feelingPose(act, feelingId)),
      back: `${base}/obstacle`,
      next: `${base}/move`,
    },
    move: {
      title: text.move.title,
      sub: text.move.sub,
      body: (
        <>
          <SectionLabel>{possessive(heroName)} way forward</SectionLabel>
          {moveGrid}
          {wordsInput(text.move.words)}
        </>
      ),
      ready: !!moveId && !!words.trim(),
      asset: `${heroName}: ${moveTitle ?? "brave move"} pose`,
      art: heroArt(story.heroType, movePose(act, moveId)),
      back: `${base}/feeling`,
      next: afterAct,
    },
  }[part];

  return (
    <WizardLayout chapter={CHAPTER[act]} progress={{ total: 3, current: step }} asset={screens.asset} art={screens.art}>
      <Card>
        <Heading>{screens.title}</Heading>
        <Subtle className="mb-6 mt-2">{screens.sub}</Subtle>
        {screens.body}
        <StepNav onBack={() => navigate(screens.back)} onNext={() => navigate(screens.next)} nextDisabled={!screens.ready} />
      </Card>
    </WizardLayout>
  );
}

export function RestScreen() {
  const [, navigate] = useLocation();
  const { story, updateStory, mode, heroName } = useAppState();
  const senior = mode === "senior";

  return (
    <WizardLayout chapter={5} progress={{ total: 3, current: 3 }} asset={`${heroName}: resting in the safe place`} art={heroArt(story.heroType, "rest")}>
      <Card>
        <Heading>{senior ? `Where does ${heroName} go to regroup?` : `Where does ${heroName} feel calm and comfortable?`}</Heading>
        <Subtle className="mt-1">
          {senior
            ? "After a difficult moment, your hero finds a place to rest, reflect, and gather strength."
            : `After a difficult moment, ${heroName} needs somewhere to pause and rest.`}
        </Subtle>
        <SectionLabel>{senior ? "A place to recharge" : `Where does ${heroName} feel calm and comfortable?`}</SectionLabel>
        <VoiceTextArea
          id="safe-place"
          value={story.safePlaceText}
          onChange={(safePlaceText) => updateStory({ safePlaceText })}
          placeholder={`${heroName} cuddles with a pet and takes a quiet moment to gather strength.`}
        />
        <Chips items={REST_IDEAS} active={story.safePlaceText} onPick={(safePlaceText) => updateStory({ safePlaceText })} />
        <StepNav
          onBack={() => navigate(mode === "senior" ? actStart(1, mode) : "/story/act/1/move")}
          onNext={() => navigate(actStart(2, mode))}
          nextDisabled={!story.safePlaceText.trim()}
        />
      </Card>
    </WizardLayout>
  );
}

export function GateScreen() {
  const [, navigate] = useLocation();
  const { updateStory, mode, heroName } = useAppState();
  const senior = mode === "senior";

  return (
    <AppShell right={<ChapterPill>{chapterLabel(7)}</ChapterPill>}>
      <div className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center text-center">
        <Heading>
          {senior ? `You shaped ${possessive(heroName)} choices, setbacks and next steps. The story is ready to read.` : "There's one more part of the journey"}
        </Heading>
        <Subtle className="mt-2">
          {senior
            ? "Your story has one more chapter waiting. Continue or finish your story here."
            : `Would you like to help ${heroName} face one more challenge, or let the story continue from here?`}
        </Subtle>
        <AssetSlot
          label="Illustration: storybook vignette (castle, fox, reading child)"
          src={asset("scenes/gate.webp")}
          className="my-8 h-[240px] w-full max-w-[240px]"
        />
        {/* One column so both choices share the same width and centre line. */}
        <div className="flex w-full max-w-[320px] flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => {
              updateStory({ facesChallenge3: true });
              navigate(actStart(3, mode));
            }}
          >
            {senior ? "Shape the Final Challenge" : `Help ${heroName} face it`} <Arrow />
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              updateStory({ facesChallenge3: false, obstacles3: [] });
              navigate(ROUTES.generating);
            }}
          >
            Continue to the Ending
          </Button>
        </div>
        <Subtle className="mt-3 text-xs">
          {senior ? `Both choices bring ${possessive(heroName)} journey to a complete, meaningful story finale.` : `Either choice will give ${possessive(heroName)} story a complete ending.`}
        </Subtle>
      </div>
    </AppShell>
  );
}
