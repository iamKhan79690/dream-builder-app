import type { Mode, ParentState, StoryState } from "@/state/AppState";
import { ROUTES } from "./routes";

export interface FlowStep {
  path: string;
  done: boolean;
}

function actSteps(act: 1 | 2 | 3, story: StoryState, mode: Mode): FlowStep[] {
  const k = {
    1: { o: story.obstacles, f: story.heartColor, m: story.braveMove, w: story.heroWords },
    2: { o: story.obstacles2, f: story.heartColor2, m: story.braveMove2, w: story.heroWords2 },
    3: { o: story.obstacles3, f: story.heartColor3, m: story.braveMove3, w: story.heroWords3 },
  }[act];
  const base = `/story/act/${act}`;
  if (mode === "senior") {
    return [{ path: `${base}/all`, done: !!(k.o.length && k.f && k.m && k.w.trim()) }];
  }
  return [
    { path: `${base}/obstacle`, done: k.o.length > 0 },
    { path: `${base}/feeling`, done: !!k.f },
    { path: `${base}/move`, done: !!(k.m && k.w.trim()) },
  ];
}

/** The child's story wizard, in order, with each step's completion state. */
export function storyFlow(story: StoryState, mode: Mode): FlowStep[] {
  const explorer = mode === "junior";
  const generated = !!story.storyGeneratedAt;
  return [
    { path: ROUTES.author, done: !!story.authorName.trim() },
    { path: ROUTES.format, done: !!story.selectedFormat },
    { path: ROUTES.style, done: !!story.comicVibe },
    { path: ROUTES.hero, done: !!story.heroType },
    ...(explorer ? [{ path: ROUTES.heroName, done: !!story.heroType }] : []),
    { path: ROUTES.strength, done: story.charStrengths.length > 0 },
    // Tools are optional; reaching the dream step counts as done.
    ...(explorer ? [{ path: ROUTES.tools, done: story.charStrengths.length > 0 }] : []),
    { path: ROUTES.dream, done: !!story.aspiration.trim() },
    ...actSteps(1, story, mode),
    { path: ROUTES.rest, done: !!story.safePlaceText.trim() },
    ...actSteps(2, story, mode),
    { path: ROUTES.gate, done: story.facesChallenge3 !== null },
    ...(story.facesChallenge3 ? actSteps(3, story, mode) : []),
    { path: ROUTES.generating, done: generated },
    { path: ROUTES.ready, done: generated },
    { path: ROUTES.book, done: story.confirmedByChild },
    { path: ROUTES.done, done: story.confirmedByChild },
  ];
}

/**
 * Where the visitor should be sent instead of `path`, or null if they may stay.
 * Enforces: account → child profile → story steps in order → parent checkout.
 */
export function redirectFor(path: string, story: StoryState, parent: ParentState, mode: Mode): string | null {
  const authPages: string[] = [ROUTES.signup, ROUTES.login];
  if (authPages.includes(path)) return parent.account ? ROUTES.children : null;
  if (!parent.account) return ROUTES.signup;

  const parentSetup: string[] = [ROUTES.children, ROUTES.addChild];
  if (parentSetup.includes(path)) return null;
  if (!parent.activeChildId) return ROUTES.children;

  const startPages: string[] = [ROUTES.start, ROUTES.library, ROUTES.handover];
  if (startPages.includes(path)) return null;

  const flow = storyFlow(story, mode);
  const firstOpen = flow.find((s) => !s.done)?.path ?? null;

  if (path.startsWith("/story/")) {
    const index = flow.findIndex((s) => s.path === path);
    // Unknown step for this mode (e.g. an Explorer opening a Creator screen).
    if (index === -1) return firstOpen ?? ROUTES.book;
    const blocker = flow.slice(0, index).find((s) => !s.done);
    return blocker ? blocker.path : null;
  }

  // Parent review & checkout need the child's confirmed story.
  if (!story.confirmedByChild) return firstOpen ?? ROUTES.book;
  if (path === ROUTES.success && !parent.order) return ROUTES.plans;
  return null;
}
