import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/Layout";
import { BookSpread, PageNav } from "@/components/BookSpread";
import { pageText } from "@/data/storyText";
import { Button, Card, Heading, Subtle } from "@/components/ui";
import { useAppState } from "@/state/AppState";
import { ROUTES } from "@/lib/routes";

/** Parent review: read-only story with per-page change requests (PRD §3.1 Phase 3). */
export function ReviewScreen() {
  const [, navigate] = useLocation();
  const { story, heroName, activeChild } = useAppState();
  const [page, setPage] = useState(1);
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState<Record<number, string>>({});
  const childName = activeChild?.name ?? "your child";

  return (
    <AppShell>
      <div className="my-auto flex flex-col items-center">
        <Heading className="mb-8">Review Your Child's Story</Heading>
        <BookSpread page={page} author={story.authorName || "Author Name"} text={pageText(page, story, heroName)} />
        <PageNav page={page} onChange={setPage} />

        {commenting && (
          <Card className="mt-6 w-full max-w-[880px] border-2 border-amber-200 p-5 sm:p-5">
            <label htmlFor="comment" className="flex items-center gap-2 text-sm font-bold text-ink">
              <MessageSquare className="h-4 w-4 text-amber-600" /> Parent note for page {page}
            </label>
            <textarea
              id="comment"
              rows={3}
              value={comments[page] ?? ""}
              onChange={(e) => setComments({ ...comments, [page]: e.target.value })}
              placeholder="Describe the change you'd like…"
              className="mt-2 w-full resize-none rounded-xl border border-ink/15 bg-amber-50/50 p-3 text-sm focus:border-amber-400 focus:outline-none"
            />
            <Subtle className="mt-2 text-xs">
              {Object.values(comments).filter(Boolean).length} page note(s) so far. Notes are shown separately from {childName}'s own words.
            </Subtle>
          </Card>
        )}

        <div className="mt-8 flex gap-3">
          <Button onClick={() => navigate(ROUTES.plans)}>Confirm Story</Button>
          <Button variant="outline" className="border-ink/10 shadow-sm" onClick={() => setCommenting(!commenting)}>
            {commenting ? "Done Adding Notes" : "Request Changes"}
          </Button>
        </div>
        <Subtle className="mt-3 max-w-md text-center text-xs">
          This is {childName}'s story — their words and ideas are what make it special. You can ask for a change, but try to
          keep it sounding like them.
        </Subtle>
      </div>
    </AppShell>
  );
}
