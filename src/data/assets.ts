import { ART_STYLES, BRAVE_MOVES, FEELINGS, FEELINGS_CREATOR_FINAL, HEROES, OBSTACLES, PANEL_LABELS, STRENGTHS_EXPLORER, TOOLS, type HeroType } from "./content";

// Every image in src/assets is bundled at build time. Paths are relative to
// src/assets, e.g. "obstacles/roaring-fire.webp". Drop a file with the expected
// name into that folder and it replaces the placeholder automatically.
const FILES = import.meta.glob("../assets/**/*.{webp,png,jpg,jpeg,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const BY_PATH = new Map(Object.entries(FILES).map(([key, url]) => [key.replace("../assets/", ""), url]));

/** URL of the first path that exists, or undefined (show the placeholder). */
export function asset(...paths: (string | undefined)[]): string | undefined {
  for (const p of paths) {
    if (p && BY_PATH.has(p)) return BY_PATH.get(p);
  }
  return undefined;
}

export type HeroPose =
  | "standing"
  | "curious"
  | "tools"
  | "dream"
  | "sad"
  | "overwhelmed"
  | "breathe"
  | "speak"
  | "rest"
  | `obstacle-${string}`
  | `tools-${string}`
  | `strength-${string}`
  | `feeling-${string}`
  | `move-${string}`;

/** A pose, or a list of poses tried in order (the specific art first, then the closest existing pose). */
export type HeroPoses = HeroPose | HeroPose[];

/** A pose of the chosen hero: the first of `poses` that exists, else their standing image. */
export function heroArt(hero: HeroType | null, poses: HeroPoses): string | undefined {
  if (!hero) return undefined;
  return asset(...[poses].flat().map((p) => `heroes/${hero}/${p}.webp`), `heroes/${hero}/standing.webp`);
}

/** Hero using the most recently chosen tool; the plain "tools" pose already shows headphones. */
export const toolPose = (tools: string[]): HeroPoses => {
  const last = tools[tools.length - 1];
  return last && last !== "headphones" ? [`tools-${last}`, "tools"] : "tools";
};

// Creator strengths are Explorer's six under older-sounding names, so they share art.
const CREATOR_STRENGTH: Record<string, string> = {
  curious: "big-curiosity",
  empathetic: "kind-heart",
  inventive: "clever-inventions",
  focused: "super-focus",
  imaginative: "creative-vision",
  resilient: "brave-courage",
};

/** Hero showing the chosen strength; Big Curiosity is the "curious" pose (magnifying glass). */
export const strengthPose = (strength: string | undefined): HeroPoses => {
  const id = strength ? (CREATOR_STRENGTH[strength] ?? strength) : "big-curiosity";
  return id === "big-curiosity" ? "curious" : [`strength-${id}`, "curious"];
};

export const heroAvatar = (hero: HeroType) => asset(`heroes/${hero}/avatar.webp`);

// Creator feelings that are Explorer feelings under older-sounding names share art.
const CREATOR_FEELING: Record<string, string> = { clouded: "foggy", "weighed-down": "heavy", "on-edge": "jumpy", burning: "thumpy" };

// Until a feeling has its own art, the closest existing pose: low feelings droop,
// stirred-up ones look overwhelmed. Steady is the calm breathing pose and needs no new art.
const FEELING_POSE: Record<string, HeroPose> = {
  heavy: "sad",
  foggy: "sad",
  "shut-out": "sad",
  stuck: "sad",
  jumpy: "overwhelmed",
  thumpy: "overwhelmed",
  fluttery: "overwhelmed",
  exposed: "overwhelmed",
};

/** Feelings that get their own pose (Explorer's, plus Creator's final-act extras). */
export const FEELING_ART_IDS = Object.keys(FEELING_POSE);

/** Hero pose on the feelings step: the chosen feeling, else Figma's default (thinking, or overwhelmed in The Return). */
export const feelingPose = (act: number, feeling?: string): HeroPoses => {
  const id = feeling && (CREATOR_FEELING[feeling] ?? feeling);
  if (id === "steady") return "breathe";
  if (id && FEELING_POSE[id]) return [`feeling-${id}`, FEELING_POSE[id]];
  return act === 2 ? "overwhelmed" : "sad";
};

// Until a move has its own art, the closest existing pose. Deep Breaths and Calm
// Honesty are the "breathe" and "speak" poses and need no new art.
const MOVE_POSE: Record<string, HeroPose> = {
  "ask-for-help": "speak",
  "lead-the-way": "speak",
  "shrink-the-giant": "curious",
  "find-first-step": "curious",
  "try-something-new": "dream",
  "stand-my-ground": "standing",
};

/** Moves that get their own pose. */
export const MOVE_ART_IDS = Object.keys(MOVE_POSE);

/** Hero pose on the brave-move step: the chosen move, else Figma's default for that act. */
export const movePose = (act: number, move: string): HeroPoses => {
  if (move === "deep-breaths") return "breathe";
  if (move === "calm-honesty") return "speak";
  if (MOVE_POSE[move]) return [`move-${move}`, MOVE_POSE[move]];
  return act === 2 ? "speak" : "breathe";
};

const titleOf = (list: { id: string; title: string }[], id: string) => list.find((x) => x.id === id)?.title ?? id;

const uniqueById =<T extends { id: string }>(list: T[]): T[] => [...new Map(list.map((x) => [x.id, x])).values()];

const HERO_POSES: HeroPose[] = ["standing", "curious", "tools", "dream", "sad", "overwhelmed", "breathe", "speak", "rest"];

/** Everything the screens can show, for the /screens/assets checklist. */
export const ASSET_MANIFEST: { group: string; items: { path: string; label: string }[] }[] = [
  {
    group: "Heroes",
    items: HEROES.flatMap((h) => [
      { path: `heroes/${h.id}/avatar.webp`, label: `${h.title} — avatar` },
      ...HERO_POSES.map((pose) => ({ path: `heroes/${h.id}/${pose}.webp`, label: `${h.title} — ${pose}` })),
      ...uniqueById(Object.values(OBSTACLES).flat()).map((o) => ({ path: `heroes/${h.id}/obstacle-${o.id}.webp`, label: `${h.title} — facing ${o.title}` })),
      ...STRENGTHS_EXPLORER.filter((s) => s.id !== "big-curiosity").map((s) => ({ path: `heroes/${h.id}/strength-${s.id}.webp`, label: `${h.title} — showing ${s.title}` })),
      ...TOOLS.filter((t) => t.id !== "headphones").map((t) => ({ path: `heroes/${h.id}/tools-${t.id}.webp`, label: `${h.title} — using ${t.title}` })),
      ...FEELING_ART_IDS.map((id) => ({ path: `heroes/${h.id}/feeling-${id}.webp`, label: `${h.title} — feeling ${titleOf([...FEELINGS, ...FEELINGS_CREATOR_FINAL], id)}` })),
      ...MOVE_ART_IDS.map((id) => ({ path: `heroes/${h.id}/move-${id}.webp`, label: `${h.title} — ${titleOf(Object.values(BRAVE_MOVES).flat(), id)}` })),
    ]),
  },
  {
    group: "Obstacles",
    items: uniqueById(Object.values(OBSTACLES).flat()).map((o) => ({ path: `obstacles/${o.id}.webp`, label: o.title })),
  },
  {
    group: "Feeling icons",
    items: uniqueById([...FEELINGS, ...FEELINGS_CREATOR_FINAL]).map((f) => ({ path: `icons/feelings/${f.id}.webp`, label: `${f.title} (${f.desc})` })),
  },
  { group: "Tool icons", items: TOOLS.map((t) => ({ path: `icons/tools/${t.id}.webp`, label: t.title })) },
  {
    group: "Formats & art styles",
    items: [
      { path: "formats/storybook.webp", label: "Format preview — storybook" },
      { path: "formats/comic.webp", label: "Format preview — comic" },
      ...(["storybook", "comic"] as const).flatMap((format) =>
        ART_STYLES.map((s) => ({ path: `styles/${format}/${s.id}.webp`, label: `${s.title} (${format})` })),
      ),
    ],
  },
  {
    group: "Scenes & book pages",
    items: [
      { path: "scenes/gate.webp", label: "Challenge Gate illustration" },
      ...PANEL_LABELS.map((label, i) => ({
        path: `panels/panel-${String(i + 1).padStart(2, "0")}.webp`,
        label: `Panel ${i + 1} — ${label}`,
      })),
    ],
  },
];
