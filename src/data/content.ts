// Wizard content. Labels and descriptions mirror the Dream Builder Figma flows.

export type HeroType = "fox" | "robot" | "knight";
export type Pronoun = "he" | "she";
export type Act = 1 | 2 | 3;

export interface Option {
  id: string;
  title: string;
  desc: string;
}

export const HEROES: (Option & { id: HeroType; defaultName: string })[] = [
  { id: "fox", title: "Ember the Fox", desc: "A clever fox with a golden tail.", defaultName: "Ember" },
  { id: "robot", title: "Sparky the Robot", desc: "A brass robot with one blue eye.", defaultName: "Sparky" },
  { id: "knight", title: "Brave the Knight", desc: "A silver knight with a glowing shield.", defaultName: "Brave" },
];

export const PRONOUNS: { id: Pronoun; title: string; desc: string }[] = [
  { id: "he", title: "He", desc: "he / him" },
  { id: "she", title: "She", desc: "she / her" },
];

export const STRENGTHS_EXPLORER: Option[] = [
  { id: "big-curiosity", title: "Big Curiosity", desc: "Loves asking questions and discovering hidden secrets in the world." },
  { id: "kind-heart", title: "Kind Heart", desc: "Helps upset friends feel safe, heard, and cheered up." },
  { id: "clever-inventions", title: "Clever Inventions", desc: "Turns everyday things into clever tools to solve tricky problems." },
  { id: "super-focus", title: "Super Focus", desc: "Stays patient and focused when tackling complicated challenges." },
  { id: "creative-vision", title: "Creative Vision", desc: "Sees beauty, bright colors, and new ways to solve problems." },
  { id: "brave-courage", title: "Brave Courage", desc: "Takes the first brave step, even when something feels new." },
];

export const STRENGTHS_CREATOR: Option[] = [
  { id: "curious", title: "Curious", desc: "Always looking deeper and asking questions." },
  { id: "empathetic", title: "Empathetic", desc: "Notices how others feel and responds with care." },
  { id: "inventive", title: "Inventive", desc: "Finds creative ways to solve difficult problems." },
  { id: "focused", title: "Focused", desc: "Stays patient and committed when things become difficult." },
  { id: "imaginative", title: "Imaginative", desc: "Sees possibilities others might overlook." },
  { id: "resilient", title: "Resilient", desc: "Keeps moving forward after setbacks." },
];

export const TOOLS: Option[] = [
  { id: "wheelchair", title: "Wheelchair", desc: "Mobility Aid" },
  { id: "headphones", title: "Headphones", desc: "Sensory Comfort" },
  { id: "fidget-toy", title: "Fidget Toy", desc: "Calm & Focus" },
  { id: "white-cane", title: "White Cane", desc: "Navigation" },
  { id: "hearing-aid", title: "Hearing Aid", desc: "Sound Aid" },
  { id: "glasses", title: "Glasses", desc: "Clear Sight" },
];

// `{hero}` is replaced with the hero's name at render time.
const OBSTACLES_FIRST: Option[] = [
  { id: "grumpy-giant", title: "Grumpy Giant", desc: "A giant refuses to let {hero} pass." },
  { id: "roaring-fire", title: "Roaring Fire", desc: "A blazing wall of flames blocks {hero_s} path." },
  { id: "humming-mist", title: "Humming Mist", desc: "A strange mist makes the way forward difficult to see." },
  { id: "messy-blueprint", title: "Messy Blueprint", desc: "{hero_s} plans get mixed up at the worst possible moment." },
];

// Figma reuses the Act 1 obstacles for the Final Act in both modes.
export const OBSTACLES: Record<Act, Option[]> = {
  1: OBSTACLES_FIRST,
  2: [
    { id: "mean-whispers", title: "Mean Whispers", desc: "Chilly voices that make {hero} think, “You can't do this!”" },
    { id: "thundering-cloud", title: "Thundering Cloud", desc: "Dark clouds and heavy rain make the path hard to see." },
    { id: "glass-wall", title: "The Glass Wall", desc: "An invisible wall blocks the path ahead." },
    { id: "mean-shadow", title: "Mean Shadow", desc: "A giant shadow makes the mountain path feel scary." },
  ],
  3: OBSTACLES_FIRST,
};

export const FEELINGS: Option[] = [
  { id: "foggy", title: "Foggy", desc: "Confused" },
  { id: "heavy", title: "Heavy", desc: "Sad" },
  { id: "jumpy", title: "Jumpy", desc: "Worried" },
  { id: "thumpy", title: "Thumpy", desc: "Mad" },
  { id: "fluttery", title: "Fluttery", desc: "Nervous" },
  { id: "steady", title: "Steady", desc: "Calm" },
];

// Creator Mode, final act: wider emotional vocabulary.
export const FEELINGS_CREATOR_FINAL: Option[] = [
  { id: "clouded", title: "Clouded", desc: "Confused" },
  { id: "weighed-down", title: "Weighed Down", desc: "Sad" },
  { id: "on-edge", title: "On Edge", desc: "Worried" },
  { id: "burning", title: "Burning", desc: "Angry" },
  { id: "exposed", title: "Exposed", desc: "Embarrassed" },
  { id: "shut-out", title: "Shut Out", desc: "Lonely" },
  { id: "stuck", title: "Stuck", desc: "Frustrated" },
  { id: "steady", title: "Steady", desc: "Calm" },
];

const MOVES_GROUNDING: Option[] = [
  { id: "shrink-the-giant", title: "Shrink the Giant", desc: "Break the huge task into three smaller, doable pieces." },
  { id: "find-first-step", title: "Find the First Step", desc: "Circle one tiny milestone on the plan and start there." },
  { id: "ask-for-help", title: "Ask for Help", desc: "Turn to a trusted friend and ask for a hand, not the answer." },
  { id: "deep-breaths", title: "Take 3 Deep Breaths", desc: "Pause, take three slow belly breaths, and let the storm blow past." },
];

export const BRAVE_MOVES: Record<Act, Option[]> = {
  1: MOVES_GROUNDING,
  2: [
    { id: "lead-the-way", title: "Lead the Way", desc: "Step forward with calm confidence and guide friends through the storm." },
    { id: "try-something-new", title: "Try Something New", desc: "Invent an unexpected, creative move that surprises the challenge." },
    { id: "stand-my-ground", title: "Stand My Ground", desc: "Hold firm with quiet patience and set a gentle, unshakeable boundary." },
    { id: "calm-honesty", title: "Speak with Calm Honesty", desc: "Use clear, steady words to say what is true without backing down." },
  ],
  3: MOVES_GROUNDING,
};

export const HERO_WORDS_PLACEHOLDER: Record<Act, string> = {
  1: "“I can start with one small step.”",
  2: "“I'll try another way.”",
  3: "“I can keep going one step at a time.”",
};

export const DREAM_IDEAS = [
  "Explore hidden star caves",
  "Build a cloud flying machine",
  "Help the whispering forest",
  "Befriend a shy mountain dragon",
  "Invent a compass that points to joy",
];

export const REST_IDEAS = [
  "Cuddling a pet",
  "Resting in a bedroom",
  "Listening to favourite music",
  "Curling up with a blanket and a book",
  "Spending time with a best friend",
  "Sitting beneath a big tree",
];

export type ArtStyle = "soft-peaceful" | "clear-bold" | "indie-graphic-novel";

export const ART_STYLES: (Option & { id: ArtStyle })[] = [
  { id: "soft-peaceful", title: "Soft and Peaceful", desc: "Gentle colours and quiet pages." },
  { id: "clear-bold", title: "Clear and Bold", desc: "Bright colours and easy-to-read lines." },
  { id: "indie-graphic-novel", title: "Indie Graphic Novel", desc: "Dramatic, deep graphic inks." },
];

export const LANGUAGES = ["English", "العربية (Arabic)"];

export const CHAPTERS = [
  "The Hero",
  "My Strength",
  "My Dream",
  "The Challenge",
  "Rest & Restore",
  "The Return",
  "Grand Finale",
] as const;

// Fifteen-panel structure (Narrative Engine Glossary §2).
export const PANEL_LABELS = [
  "Identity Anchor",
  "Internal Gift",
  "The Call",
  "First Shadow",
  "First Pivot",
  "The Heavy Heart",
  "Rest & Restoration",
  "Second Shadow",
  "Second Brave Move",
  "Persistence",
  "Plateau Triumph",
  "Third Shadow / Deepest Pause",
  "Final Pivot",
  "Grand Finale",
  "Practice Anchor",
];

export type PlanId = "digital" | "hardback" | "softcover";

export const CURRENCY = "$";

export const PLANS: { id: PlanId; title: string; price: number; features: string[]; popular?: boolean; cta: string }[] = [
  {
    id: "digital",
    title: "Digital Storybook",
    price: 499,
    features: ["Downloadable PDF", "Story illustrations and text", "Offline reading"],
    cta: "Choose Digital",
  },
  {
    id: "hardback",
    title: "Premium Hardback",
    price: 799,
    popular: true,
    features: [
      "Printed hardback storybook",
      "Hardcover binding",
      "QR Voice-Anchor, subject to the required audio steps",
      "Delivery to your address",
    ],
    cta: "Choose Hardcover",
  },
  {
    id: "softcover",
    title: "Printed Softcover",
    price: 1499,
    features: ["Printed storybook", "Softcover binding", "Delivery to your address"],
    cta: "Choose Soft Cover",
  },
];
