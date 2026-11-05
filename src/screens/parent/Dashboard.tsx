import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/Layout";
import { Arrow, Button, Card, Subtle } from "@/components/ui";
import { CURRENCY, PLANS } from "@/data/content";
import { modeForAge, useAppState, type ChildProfile } from "@/state/AppState";
import { cx, possessive } from "@/lib/text";
import { ROUTES } from "@/lib/routes";
import { resumePoint } from "@/screens/story/Start";

// Parent home after login (Figma "Parent Dashboard"): child profiles, stories
// waiting for review, recent stories, and orders with their status.
// The app keeps one story and one order in local state, so each list holds at most one entry.

type Tone = "amber" | "brand" | "green" | "slate";

const TONES: Record<Tone, string> = {
  amber: "bg-[#FEF3C7] text-[#92400E]",
  brand: "bg-brand-soft text-brand",
  green: "bg-[#DCFCE7] text-[#166534]",
  slate: "bg-[#F1F5F9] text-ink-muted",
};

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold", TONES[tone])}>{children}</span>;
}

/** Joins non-empty parts with the Figma " • " separator. */
const meta = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join("  •  ");

const modeLabel = (age: number) => (modeForAge(age) === "junior" ? "Explorer Mode" : "Creator Mode");

function finishedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Finished today";
  if (days === 1) return "Finished yesterday";
  return `Finished ${date.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}`;
}

function Section({ title, badge, highlight, children }: { title: string; badge?: string; highlight?: boolean; children: ReactNode }) {
  return (
    <Card className={cx("p-5 sm:p-8", highlight && "border-2 border-brand")}>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
        {badge && <Pill tone="brand">{badge}</Pill>}
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

/** Grey row: title + meta on the left, actions on the right (stacked on phones). */
function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-tile p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
      <div className="min-w-0">
        <p className="font-display text-[17px] font-semibold text-ink sm:text-xl">{title}</p>
        <p className="mt-1 text-[13px] text-ink-muted sm:text-sm">{detail}</p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">{children}</div>
    </div>
  );
}

function TextLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
      {children} <Arrow />
    </button>
  );
}

export function DashboardScreen() {
  const [, navigate] = useLocation();
  const { parent, updateParent, story, heroName } = useAppState();

  const firstName = parent.account?.name.trim().split(/\s+/)[0] ?? "";
  const author = parent.children.find((c) => c.id === (story.childId ?? parent.activeChildId)) ?? null;
  const authorMode = author ? modeForAge(author.age) : "junior";
  const hasStory = !!story.heroType && !!author;
  const storyTitle = `${possessive(heroName)} Magical Journey`;
  const finished = finishedLabel(story.storyGeneratedAt);
  const waitingForReview = hasStory && story.confirmedByChild && !parent.order;
  const inProgress = hasStory && !story.confirmedByChild;

  const asChild = (child: ChildProfile, route: string) => {
    updateParent({ activeChildId: child.id });
    navigate(route);
  };

  const order = parent.order;
  const plan = order ? PLANS.find((p) => p.id === order.plan) : undefined;
  const digital = order?.plan === "digital";

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1216px] space-y-6 sm:space-y-8">
        <header>
          <h1 className="font-display text-[28px] font-bold leading-tight text-ink sm:text-4xl">
            Welcome back{firstName && `, ${firstName}`}
          </h1>
          <Subtle className="mt-1.5 sm:text-base">Here's what's happening with your young authors.</Subtle>
        </header>

        {/* Child profiles: swipe row on phones, three columns on desktop. */}
        <section aria-label="Child profiles" className="-mx-4 snap-x overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex gap-3 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {parent.children.map((child) => {
              const busy = inProgress && author?.id === child.id;
              return (
                <Card key={child.id} className="flex w-[250px] shrink-0 flex-col gap-4 p-6 sm:w-auto sm:p-6">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-[22px] font-bold text-brand">
                      {child.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[22px] font-semibold text-ink">{child.name}</span>
                      {/* Phones drop the word "Mode" so the line fits the 250px swipe card. */}
                      <span className="block text-sm text-ink-muted">
                        {meta(`${child.age} years`, modeLabel(child.age).replace(" Mode", ""))}
                        <span className="hidden sm:inline"> Mode</span>
                      </span>
                    </span>
                  </div>
                  <Pill tone={busy ? "amber" : "slate"}>{busy ? "1 story in progress" : "No story in progress"}</Pill>
                  <Button className="w-fit" onClick={() => asChild(child, ROUTES.handover)}>
                    Hand over to {child.name} <Arrow />
                  </Button>
                </Card>
              );
            })}
            <button
              type="button"
              onClick={() => navigate(ROUTES.addChild)}
              className="flex min-h-[205px] w-[250px] shrink-0 flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-ink/40 bg-white/50 hover:border-brand/60 sm:w-auto"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-[15px] font-extrabold tracking-wider text-ink">{parent.children.length ? "ADD CHILD" : "ADD YOUR FIRST CHILD"}</span>
            </button>
          </div>
        </section>

        {waitingForReview && author && (
          <Section title="Stories waiting for review" badge="1 waiting" highlight>
            <Row title={storyTitle} detail={meta(`By ${author.name}`, modeLabel(author.age), finished)}>
              <Button className="w-full sm:w-auto" onClick={() => asChild(author, ROUTES.review)}>
                Review Story <Arrow />
              </Button>
            </Row>
          </Section>
        )}

        <Section title="Recent stories">
          {hasStory && author ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-2 rounded-2xl bg-tile p-5">
                {inProgress ? (
                  <Pill tone="amber">In Progress</Pill>
                ) : waitingForReview ? (
                  <Pill tone="brand">Waiting for review</Pill>
                ) : (
                  <Pill tone="green">Ordered</Pill>
                )}
                <p className="font-display text-lg font-semibold text-ink">{storyTitle}</p>
                <p className="text-sm text-ink-muted">
                  {meta(
                    `By ${author.name}`,
                    inProgress ? `Chapter ${resumePoint(story, authorMode).chapter} of 7` : finished,
                  )}
                </p>
                <div className="mt-1">
                  {inProgress ? (
                    <TextLink onClick={() => asChild(author, ROUTES.handover)}>Continue with {author.name}</TextLink>
                  ) : waitingForReview ? (
                    <TextLink onClick={() => asChild(author, ROUTES.review)}>Review</TextLink>
                  ) : (
                    <TextLink onClick={() => asChild(author, ROUTES.success)}>View order</TextLink>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Subtle>No stories yet. Hand the device to a child to start their first story.</Subtle>
          )}
        </Section>

        {order && plan && author && (
          <Section title="Orders">
            <Row title={storyTitle} detail={meta(`Order ${order.orderNumber}`, plan.title, `${CURRENCY}${order.amount.toLocaleString()}`, `By ${author.name}`)}>
              <Pill tone={digital ? "green" : "amber"}>{digital ? "Ready to download" : "Being prepared"}</Pill>
              <TextLink onClick={() => asChild(author, ROUTES.success)}>{digital ? "Download" : "View Order"}</TextLink>
            </Row>
          </Section>
        )}
      </div>
    </AppShell>
  );
}
