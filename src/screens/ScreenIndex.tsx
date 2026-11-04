import { Link } from "wouter";
import { AppShell } from "@/components/Layout";
import { Button, Card, Heading, Subtle } from "@/components/ui";
import { EMPTY_STORY, useAppState, type StoryState } from "@/state/AppState";
import { ROUTES } from "@/lib/routes";

// Dev-only index: seeds demo data so any screen can be opened directly.

const DEMO_STORY: StoryState = {
  ...EMPTY_STORY,
  authorName: "Alex Morgan",
  selectedFormat: "storybook",
  comicVibe: "clear-bold",
  heroType: "knight",
  charName: "Pip",
  heroPronoun: "he",
  charStrengths: ["big-curiosity"],
  selfLove: "kind to everyone",
  charTools: ["headphones"],
  aspiration: "Build a cloud flying machine",
  obstacles: ["roaring-fire"],
  heartColor: "heavy",
  braveMove: "deep-breaths",
  heroWords: "I can start with one small step.",
  safePlaceText: "Cuddling a pet",
  obstacles2: ["mean-shadow"],
  heartColor2: "heavy",
  braveMove2: "calm-honesty",
  heroWords2: "I'll try another way.",
  facesChallenge3: true,
  obstacles3: ["messy-blueprint"],
  heartColor3: "steady",
  braveMove3: "find-first-step",
  heroWords3: "I can keep going one step at a time.",
  storyGeneratedAt: new Date().toISOString(),
  confirmedByChild: true,
};

const GROUPS: { title: string; links: [string, string][] }[] = [
  {
    title: "Parent — account & handover",
    links: [
      ["Create account", ROUTES.signup],
      ["Log in", ROUTES.login],
      ["Child profiles", ROUTES.children],
      ["Add child", ROUTES.addChild],
      ["Handover", ROUTES.handover],
    ],
  },
  {
    title: "Child — setup",
    links: [
      ["Start", ROUTES.start],
      ["Story library", ROUTES.library],
      ["Author name", ROUTES.author],
      ["Format", ROUTES.format],
      ["Art style", ROUTES.style],
      ["Choose hero", ROUTES.hero],
      ["Name hero (Explorer)", ROUTES.heroName],
      ["Strength", ROUTES.strength],
      ["Helpful tools (Explorer)", ROUTES.tools],
      ["Dream", ROUTES.dream],
    ],
  },
  {
    title: "Child — the three acts",
    links: [
      ["Act 1 · obstacle", "/story/act/1/obstacle"],
      ["Act 1 · feeling", "/story/act/1/feeling"],
      ["Act 1 · brave move", "/story/act/1/move"],
      ["Act 1 · combined (Creator)", "/story/act/1/all"],
      ["Rest & restore", ROUTES.rest],
      ["Act 2 · obstacle", "/story/act/2/obstacle"],
      ["Act 2 · combined (Creator)", "/story/act/2/all"],
      ["Challenge gate", ROUTES.gate],
      ["Final act · obstacle", "/story/act/3/obstacle"],
      ["Final act · combined (Creator)", "/story/act/3/all"],
    ],
  },
  {
    title: "Reveal, review & checkout",
    links: [
      ["Generating", ROUTES.generating],
      ["Story ready (cover)", ROUTES.ready],
      ["Book reader", ROUTES.book],
      ["Ask a parent", ROUTES.done],
      ["Parent review", ROUTES.review],
      ["Plans", ROUTES.plans],
      ["Payment (hardback)", `${ROUTES.pay}?plan=hardback`],
      ["Payment (digital)", `${ROUTES.pay}?plan=digital`],
      ["Order success", ROUTES.success],
    ],
  },
];

export function ScreenIndex() {
  const { updateStory, updateParent } = useAppState();

  const seed = (age: number) => {
    const id = age < 12 ? "demo-alex" : "demo-maya";
    updateParent({
      account: { name: "Sarah Jenkins", email: "parent@example.com" },
      children: [
        { id: "demo-alex", name: "Alex", age: 8, language: "English" },
        { id: "demo-maya", name: "Maya", age: 14, language: "English" },
      ],
      activeChildId: id,
      order: { plan: "hardback", orderNumber: "DB-89241", amount: 799 },
    });
    updateStory({ ...DEMO_STORY, authorName: age < 12 ? "Alex Morgan" : "Maya Morgan" });
  };

  return (
    <AppShell>
      <Heading className="mt-4">All Screens</Heading>
      <Subtle className="mt-1">
        Preview mode is on: every screen opens directly. Load demo data for a mode, then open any screen.
      </Subtle>
      <Link href="/screens/assets" className="mt-2 inline-block text-sm font-bold text-brand hover:underline">
        Asset checklist →
      </Link>
      <div className="mt-5 flex gap-3">
        <Button onClick={() => seed(8)}>Load Explorer demo (Alex, 8)</Button>
        <Button variant="outline" onClick={() => seed(14)}>
          Load Creator demo (Maya, 14)
        </Button>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {GROUPS.map((g) => (
          <Card key={g.title}>
            <h2 className="mb-3 font-bold text-ink">{g.title}</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {g.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-brand hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
