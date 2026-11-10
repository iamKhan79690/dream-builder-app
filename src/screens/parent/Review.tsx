import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/Layout";
import { Flipbook } from "@/components/Flipbook";
import { pageText } from "@/data/storyText";
import { PANEL_LABELS } from "@/data/content";
import { Button, Card, Heading, Subtle } from "@/components/ui";
import { useAppState } from "@/state/AppState";
import { possessive } from "@/lib/text";
import { ROUTES } from "@/lib/routes";

/** Parent review: read-only story with per-page change requests (PRD §3.1 Phase 3). */
export function ReviewScreen() {
  const [, navigate] = useLocation();
  const { story, heroName, activeChild } = useAppState();
  const [page, setPage] = useState<number | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState<Record<number, string>>({});
  const childName = activeChild?.name ?? "your child";
  const noteCount = Object.values(comments).filter((c) => c.trim()).length;

  return (
    <AppShell>
      <div className="my-auto flex w-full flex-col items-center">
        <Heading className="text-center">Review Your Child's Story</Heading>
        <Subtle className="mb-8 mt-1 text-center">Turn the pages of {possessive(heroName)} adventure, just as it will be printed.</Subtle>
        <Flipbook textFor={(p) => pageText(p, story, heroName)} notes={comments} onPositionChange={(at) => setPage(at.part)} />

        {commenting && (
          <Card className="mt-6 w-full max-w-[880px] border-2 border-amber-200 p-5 sm:p-5">
            <label htmlFor="comment" className="flex items-center gap-2 text-sm font-bold text-ink">
              <MessageSquare className="h-4 w-4 text-amber-600" /> {page ? `Parent note for “${PANEL_LABELS[page - 1]}”` : "Parent note"}
            </label>
            <textarea
              id="comment"
              rows={3}
              disabled={page === null}
              value={page ? (comments[page] ?? "") : ""}
              onChange={(e) => page && setComments({ ...comments, [page]: e.target.value })}
              placeholder={page ? "Describe the change you'd like…" : "Turn to a story page to add a note."}
              className="mt-2 w-full resize-none rounded-xl border border-ink/15 bg-amber-50/50 p-3 text-sm focus:border-amber-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Subtle className="mt-2 text-xs">
              {noteCount} page note(s) so far. Notes are shown separately from {childName}'s own words.
            </Subtle>
          </Card>
        )}

        {/* While notes are being written, finishing them is the only next step; Confirm Story comes back afterwards. */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {commenting ? (
            <Button onClick={() => setCommenting(false)}>Done Editing Notes</Button>
          ) : (
            <>
              <Button onClick={() => navigate(ROUTES.plans)}>Confirm Story</Button>
              <Button variant="outline" className="border-ink/10 shadow-sm" onClick={() => setCommenting(true)}>
                {noteCount ? "Edit Notes" : "Request Changes"}
              </Button>
            </>
          )}
        </div>
        {!commenting && noteCount > 0 && (
          <p className="mt-3 text-center text-xs font-semibold text-amber-700">
            {noteCount} page note{noteCount === 1 ? "" : "s"} will be sent with this story.
          </p>
        )}
        <Subtle className="mt-3 max-w-md text-center text-xs">
          This is {childName}'s story — their words and ideas are what make it special. You can ask for a change, but try to
          keep it sounding like them.
        </Subtle>
      </div>
    </AppShell>
  );
}
