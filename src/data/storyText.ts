import {
  BRAVE_MOVES,
  FEELINGS,
  FEELINGS_CREATOR_FINAL,
  OBSTACLES,
  STRENGTHS_CREATOR,
  STRENGTHS_EXPLORER,
  TOOLS,
  type Act,
  type HeroType,
  type Option,
} from "./content";
import type { StoryState } from "@/state/AppState";
import { fill, possessive, PRONOUN_FORMS } from "@/lib/text";

// Sample page text built from the child's choices, one page per panel of the
// 15-panel structure (Glossary §2). Stand-in until the story generator exists.

const HERO_NOUN: Record<HeroType, string> = {
  fox: "a clever young fox with a golden tail",
  robot: "a brass robot with one bright blue eye",
  knight: "a young knight with a curious mind",
};

const find = (list: Option[], id?: string) => list.find((o) => o.id === id);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sentence = (s: string) => s.trim().replace(/[.!?]+$/, "");
const unquote = (s: string) => s.trim().replace(/^["“'‘]+|["”'’]+$/g, "");

// The option descriptions are written in the present tense for the picker;
// the story is told in the past tense.
const OBSTACLE_LINES: Record<string, string> = {
  "grumpy-giant": "A grumpy giant stood in the middle of the path and refused to let {hero} pass.",
  "roaring-fire": "A blazing wall of flames roared up and blocked {hero_s} path.",
  "humming-mist": "A strange, humming mist rolled in, and the way forward became hard to see.",
  "messy-blueprint": "{hero_s} careful plans got all mixed up at the worst possible moment.",
  "mean-whispers": "Chilly voices began to whisper, “You can't do this!”",
  "thundering-cloud": "Dark clouds rumbled overhead, and heavy rain made the path hard to see.",
  "glass-wall": "An invisible glass wall blocked the path ahead.",
  "mean-shadow": "A giant shadow stretched across the mountain path and made it feel scary.",
};

/** A strength description continued after "Even now, he …". */
const strengthClause = (desc: string) => lowerFirst(sentence(desc)).replace(/^always /, "is always ");

/** What the hero says on the three "pivot" pages, shown as a quote callout. */
export function pageQuote(page: number, story: StoryState): string | null {
  const words = { 1: "“I wonder what's waiting for me?”", 5: story.heroWords, 9: story.heroWords2, 13: story.heroWords3 }[page];
  if (!words?.trim()) return null;
  return `“${unquote(words)}”`;
}

export function pageText(page: number, story: StoryState, hero: string): string {
  const p = PRONOUN_FORMS[story.heroPronoun ?? "he"];
  const He = upperFirst(p.subject);
  const His = upperFirst(p.possessive);
  const heros = possessive(hero);

  const strength = find([...STRENGTHS_EXPLORER, ...STRENGTHS_CREATOR], story.charStrengths[0]);
  const tools = story.charTools.map((id) => find(TOOLS, id)?.title.toLowerCase()).filter(Boolean);
  const dream = sentence(story.aspiration) || "find something wonderful at the end of the path";
  const feelings = [...FEELINGS, ...FEELINGS_CREATOR_FINAL];

  const act = (n: Act, obstacle: string[], feeling: string, move: string) => ({
    obstacle: find(OBSTACLES[n], obstacle[0]),
    feeling: find(feelings, feeling),
    move: find(BRAVE_MOVES[n], move),
  });
  const a1 = act(1, story.obstacles, story.heartColor, story.braveMove);
  const a2 = act(2, story.obstacles2, story.heartColor2, story.braveMove2);
  const a3 = act(3, story.obstacles3, story.heartColor3, story.braveMove3);

  const meets = (o: Option | undefined, fallback: string) => (o ? fill(OBSTACLE_LINES[o.id] ?? o.desc, hero) : fallback);
  const feels = (f: Option | undefined) =>
    f?.id === "steady"
      ? `${hero} felt steady and calm, ready to face it.`
      : f ? `${hero} felt ${f.title.toLowerCase()} inside, ${lowerFirst(f.desc)} and unsure what to do next.` : `${hero} felt unsure what to do next.`;
  const tries = (m: Option | undefined) => (m ? `${He} decided to ${lowerFirst(sentence(m.desc))}.` : `${He} decided to try again, one small step at a time.`);

  // Typed text that already names the hero is used as written; a chip like
  // "Cuddling a pet" becomes "He found comfort in cuddling a pet."
  const restLine = (text: string) => {
    const t = sentence(text);
    if (!t) return `${He} found a quiet, cosy spot.`;
    return t.toLowerCase().startsWith(hero.toLowerCase()) ? `${upperFirst(t)}.` : `${He} found comfort in ${lowerFirst(t)}.`;
  };

  const pages: Record<number, string> = {
    1: `Once in the magical realm of Eldoria lived ${hero}, ${story.heroType ? HERO_NOUN[story.heroType] : "a hero with a curious mind"}. ${hero} loved asking questions and discovering what was hidden around the world. ${
      tools.length ? `Whenever the world became too busy, ${p.subject} used ${p.possessive} ${tools.join(" and ")} and found a quiet moment to focus. ` : ""
    }One day, ${hero} discovered a mysterious path leading deep into the Whispering Woods.`,

    2: `${hero} had a special gift that nobody could see from the outside. ${
      strength ? `It was ${strength.title}. Even now, ${p.subject} ${strengthClause(strength.desc)}.` : `${He} noticed little things that others walked right past.`
    }${story.selfLove.trim() ? ` What ${p.subject} loved most about ${p.object}self was being ${lowerFirst(sentence(story.selfLove))}.` : ""}`,

    3: `As the trees whispered overhead, ${hero} remembered a big dream: to ${lowerFirst(dream)}. ${He} took a deep breath, tightened ${p.possessive} pack, and stepped onto the path to find out if the dream could come true.`,

    4: `The path had not gone far before something blocked the way. ${meets(a1.obstacle, `A challenge stood in ${heros} way.`)} ${hero} stopped and looked up. The way forward did not look easy at all.`,

    5: `${feels(a1.feeling)} But ${hero} remembered ${p.possessive} dream. ${tries(a1.move)} Little by little, the challenge began to feel smaller.`,

    6: `It took more than one try. Some moments felt heavy, and ${hero} wished it could all be easier. Still, ${p.subject} kept going, because brave does not mean never feeling scared. It means trying anyway.`,

    7: `After the hard moment, ${hero} needed somewhere to rest. ${
      restLine(story.safePlaceText)
    } There, ${p.subject} felt calm and comfortable, and ${p.possessive} strength slowly came back.`,

    8: `Feeling rested, ${hero} set off again, remembering what had helped before. But soon another challenge appeared. ${meets(a2.obstacle, "The path grew difficult once more.")}`,

    9: `${feels(a2.feeling)} This time ${hero} knew a little more about being brave. ${tries(a2.move)}`,

    10: `It did not work straight away. ${hero} tried, paused, and tried again. Each small step made ${p.object} a little stronger, and ${p.possessive} ${strength ? strength.title.toLowerCase() : "special gift"} helped ${p.object} keep going.`,

    11: `At last ${hero} reached a high, sunny place where ${p.subject} could see how far ${p.subject} had come. ${His} dream to ${lowerFirst(dream)} felt closer than ever before.`,

    12:
      story.facesChallenge3 && a3.obstacle
        ? `But there was one last thing standing in ${heros} way. ${meets(a3.obstacle, "")} ${feels(a3.feeling)}`
        : `${hero} paused for a quiet moment and thought about everything ${p.subject} had faced. The hardest parts were behind ${p.object} now.`,

    13: story.facesChallenge3
      ? `${hero} remembered every brave step from the journey. ${tries(a3.move)} And this time, the way forward opened.`
      : `${hero} remembered every brave step from the journey: the rest, the courage and the tries that did not work at first. Together, they had made ${p.object} stronger.`,

    14: `And so ${hero} reached the end of the path, ready to ${lowerFirst(dream)}. The whole of Eldoria seemed to cheer. ${hero} had not always felt brave, but ${p.subject} had kept going, and that made all the difference.`,

    15: `Whenever a new challenge appears, ${hero} remembers this journey. ${He} can stop, take a breath, and choose one small, brave step. And so can you.`,
  };
  return pages[page] ?? "";
}
