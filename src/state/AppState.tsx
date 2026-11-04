import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { HEROES, PRONOUNS, type ArtStyle, type HeroType, type PlanId, type Pronoun } from "@/data/content";

// Frontend-only state. Field names follow StoryState in the PRD (§5) so the
// shape can be sent to the API unchanged once a backend exists.

export type Mode = "junior" | "senior";

export interface StoryState {
  authorName: string;
  selectedFormat: "storybook" | "comic" | null;
  comicVibe: ArtStyle | null;
  heroType: HeroType | null;
  charName: string;
  heroPronoun: Pronoun;
  charStrengths: string[];
  selfLove: string;
  charTools: string[];
  aspiration: string;
  obstacles: string[];
  heartColor: string;
  braveMove: string;
  heroWords: string;
  safePlaceText: string;
  obstacles2: string[];
  heartColor2: string;
  braveMove2: string;
  heroWords2: string;
  /** null = not decided yet; false = child skipped the Challenge Gate. */
  facesChallenge3: boolean | null;
  obstacles3: string[];
  // Not in the PRD StoryState yet — the Figma final act collects a feeling.
  heartColor3: string;
  braveMove3: string;
  heroWords3: string;
  storyGeneratedAt: string | null;
  confirmedByChild: boolean;
}

export const EMPTY_STORY: StoryState = {
  authorName: "",
  selectedFormat: null,
  comicVibe: null,
  heroType: null,
  charName: "",
  heroPronoun: "he",
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
};

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  language: string;
}

export interface Order {
  plan: PlanId;
  orderNumber: string;
  amount: number;
}

export interface ParentState {
  account: { name: string; email: string } | null;
  children: ChildProfile[];
  activeChildId: string | null;
  order: Order | null;
}

const EMPTY_PARENT: ParentState = { account: null, children: [], activeChildId: null, order: null };

const STORY_KEY = "dreamBuilder.storyState.v1";
const PARENT_KEY = "dreamBuilder.parentState.v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode etc.) — state stays in memory.
  }
}

export function modeForAge(age: number): Mode {
  return age < 12 ? "junior" : "senior";
}

interface AppStateValue {
  story: StoryState;
  updateStory: (patch: Partial<StoryState>) => void;
  resetStory: () => void;
  parent: ParentState;
  updateParent: (patch: Partial<ParentState>) => void;
  activeChild: ChildProfile | null;
  mode: Mode;
  heroName: string;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [story, setStory] = useState<StoryState>(() => {
    const saved = load(STORY_KEY, EMPTY_STORY);
    // Drafts saved before "They" was removed fall back to the default pronoun.
    return PRONOUNS.some((p) => p.id === saved.heroPronoun) ? saved : { ...saved, heroPronoun: EMPTY_STORY.heroPronoun };
  });
  const [parent, setParent] = useState<ParentState>(() => load(PARENT_KEY, EMPTY_PARENT));

  useEffect(() => save(STORY_KEY, story), [story]);
  useEffect(() => save(PARENT_KEY, parent), [parent]);

  const value = useMemo<AppStateValue>(() => {
    const activeChild = parent.children.find((c) => c.id === parent.activeChildId) ?? null;
    const defaultName = HEROES.find((h) => h.id === story.heroType)?.defaultName ?? "Sparky";
    return {
      story,
      updateStory: (patch) => setStory((s) => ({ ...s, ...patch })),
      resetStory: () => setStory(EMPTY_STORY),
      parent,
      updateParent: (patch) => setParent((p) => ({ ...p, ...patch })),
      activeChild,
      mode: activeChild ? modeForAge(activeChild.age) : "junior",
      // charName → heroType default → 'Sparky' (PRD F1 fallback chain)
      heroName: story.charName.trim() || defaultName,
    };
  }, [story, parent]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
