# Dream Builder

Dream Builder is an interactive, child-centred story creation experience. It guides a child and their parent through choosing a story format and visual style, creating a hero, exploring challenges and feelings, and producing a personalised storybook.

## What is included

- Parent sign-up, sign-in, child profiles, handover, and review screens
- Guided story setup: author, format, art style, hero, strengths, tools, and dream
- Two story modes with a structured act, challenge-gate, rest, reveal, and book flow
- Checkout and completion screens
- A screen index at `/screens` for reviewing every interface directly
- Custom illustration assets for heroes, obstacles, tools, feelings, and book pages

## Technology

- React 18 and TypeScript
- Vite
- Wouter for client-side routing
- Tailwind CSS
- Lucide React icons

## Run locally

Prerequisites: Node.js 18 or later and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Useful commands

```bash
npm run typecheck
npm run build
npm run preview
```

## Project structure

```text
src/
  assets/       Illustrations and visual assets
  components/   Shared UI and storybook components
  data/         Story content and asset definitions
  lib/          Routes, flow rules, and text helpers
  screens/      Parent, story, checkout, and preview screens
  state/        Application state
```

## Previewing screens

Visit `/screens` in the running app to enter preview mode. This makes it possible to open individual screens without completing the guided flow first.

## Asset attribution

The generated artwork is documented in `Dream-Builder-Generated-Art/README.txt`.
