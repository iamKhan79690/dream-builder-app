import type { Pronoun } from "@/data/content";

/** "Pip" -> "Pip's", "Jess" -> "Jess'" (avoids the "Pip's's" double possessive). */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/** Fills `{hero}` and `{hero_s}` placeholders in content strings. */
export function fill(text: string, hero: string): string {
  return text.replaceAll("{hero_s}", possessive(hero)).replaceAll("{hero}", hero);
}

export const PRONOUN_FORMS: Record<Pronoun, { subject: string; object: string; possessive: string }> = {
  he: { subject: "he", object: "him", possessive: "his" },
  she: { subject: "she", object: "her", possessive: "her" },
};

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
