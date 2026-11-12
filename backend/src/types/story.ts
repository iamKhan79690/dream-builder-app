import { z } from "zod";

// Mirrors `StoryState` in the frontend's src/state/AppState.tsx (and the unions in
// src/data/content.ts). Field names and types must stay identical: if the frontend
// changes StoryState, change this file too.

// From content.ts
const HeroTypeSchema = z.enum(["fox", "robot", "knight"]);
const PronounSchema = z.enum(["he", "she"]);
const ArtStyleSchema = z.enum(["soft-peaceful", "clear-bold", "indie-graphic-novel"]);

// Length limits keep one request from stuffing megabytes into the database.
// They're generous so no real answer from a child gets rejected.
const shortText = z.string().max(100); // names
const text = z.string().max(2000); // free-text answers
const list = z.array(z.string().max(500)).max(20); // multi-pick answers

export const StoryStateSchema = z.object({
  authorName: shortText,
  selectedFormat: z.enum(["storybook", "comic"]).nullable(),
  comicVibe: ArtStyleSchema.nullable(),
  heroType: HeroTypeSchema.nullable(),
  charName: shortText,
  heroPronoun: PronounSchema.nullable(), // null until the child picks one
  charStrengths: list,
  selfLove: text,
  charTools: list,
  aspiration: text,
  obstacles: list,
  heartColor: text,
  braveMove: text,
  heroWords: text,
  safePlaceText: text,
  obstacles2: list,
  heartColor2: text,
  braveMove2: text,
  heroWords2: text,
  facesChallenge3: z.boolean().nullable(), // null = not decided, false = skipped the Challenge Gate
  obstacles3: list,
  heartColor3: text,
  braveMove3: text,
  heroWords3: text,
  storyGeneratedAt: z.iso.datetime().nullable(),
  confirmedByChild: z.boolean(),
  childId: z.uuid().nullable(),
});

export type StoryState = z.infer<typeof StoryStateSchema>;

// Same values as EMPTY_STORY in the frontend.
export const EMPTY_STORY: StoryState = {
  authorName: "",
  selectedFormat: null,
  comicVibe: null,
  heroType: null,
  charName: "",
  heroPronoun: null,
  charStrengths: [],
  selfLove: "",
  charTools: [],
  aspiration: "",
  obstacles: [],
  heartColor: "",
  braveMove: "",
  heroWords: "",
  safePlaceText: "",
  obstacles2: [],
  heartColor2: "",
  braveMove2: "",
  heroWords2: "",
  facesChallenge3: null,
  obstacles3: [],
  heartColor3: "",
  braveMove3: "",
  heroWords3: "",
  storyGeneratedAt: null,
  confirmedByChild: false,
  childId: null,
};

// What the client may send in PATCH /stories/:id.
// - omit: the server controls these three. childId is fixed at creation,
//   confirmedByChild is set by /confirm, storyGeneratedAt by story generation.
// - partial: send only the fields that changed.
// - strict: an unknown field (a typo, or one of the omitted ones) is a 400,
//   not silently dropped, so mistakes show up right away.
export const StoryPatchSchema = StoryStateSchema.omit({
  childId: true,
  confirmedByChild: true,
  storyGeneratedAt: true,
})
  .partial()
  .strict();

export type StoryPatch = z.infer<typeof StoryPatchSchema>;

// draft -> generating -> child_review -> parent_review -> final
// (generating goes back to draft if generation fails)
export const STORY_STATUSES = ["draft", "generating", "child_review", "parent_review", "final"] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];
