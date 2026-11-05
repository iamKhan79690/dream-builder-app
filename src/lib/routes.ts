import type { Act } from "@/data/content";
import type { Mode } from "@/state/AppState";

export type ActPart = "obstacle" | "feeling" | "move" | "all";

/** Explorer splits each act into three screens; Creator answers it on one. */
export function actStart(act: Act, mode: Mode): string {
  return `/story/act/${act}/${mode === "senior" ? "all" : "obstacle"}`;
}

export const ROUTES = {
  start: "/",
  library: "/library",
  signup: "/signup",
  login: "/login",
  dashboard: "/parent/dashboard",
  children: "/parent/children",
  addChild: "/parent/children/new",
  handover: "/parent/handover",
  author: "/story/author",
  format: "/story/format",
  style: "/story/style",
  hero: "/story/hero",
  heroName: "/story/hero/name",
  strength: "/story/strength",
  tools: "/story/tools",
  dream: "/story/dream",
  rest: "/story/rest",
  gate: "/story/gate",
  generating: "/story/generating",
  ready: "/story/ready",
  book: "/story/book",
  done: "/story/done",
  review: "/parent/review",
  plans: "/checkout",
  pay: "/checkout/pay",
  success: "/checkout/success",
} as const;
