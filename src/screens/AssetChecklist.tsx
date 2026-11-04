import { Link } from "wouter";
import { CheckCircle2, Circle } from "lucide-react";
import { AppShell } from "@/components/Layout";
import { Card, Heading, Subtle } from "@/components/ui";
import { asset, ASSET_MANIFEST } from "@/data/assets";

/** Dev page: which artwork files exist in src/assets and which are still placeholders. */
export function AssetChecklist() {
  const all = ASSET_MANIFEST.flatMap((g) => g.items);
  const found = all.filter((i) => asset(i.path)).length;

  return (
    <AppShell>
      <Link href="/screens" className="text-sm font-bold text-brand hover:underline">
        ← All screens
      </Link>
      <Heading className="mt-3">Asset Checklist</Heading>
      <Subtle className="mt-1">
        {found} of {all.length} images in place. Add a file at <code className="rounded bg-tile px-1">frontend/src/assets/&lt;path&gt;</code>{" "}
        and its placeholder is replaced automatically. Optional poses fall back to the hero's standing image.
      </Subtle>
      <div className="mt-8 space-y-6">
        {ASSET_MANIFEST.map((group) => {
          const have = group.items.filter((i) => asset(i.path)).length;
          return (
            <Card key={group.group}>
              <h2 className="mb-4 flex items-center justify-between font-bold text-ink">
                {group.group}
                <span className="text-xs font-semibold text-ink-muted">
                  {have}/{group.items.length}
                </span>
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const src = asset(item.path);
                  return (
                    <li key={item.path} className="flex items-center gap-3 rounded-xl bg-tile p-2">
                      {src ? (
                        <img src={src} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain" />
                      ) : (
                        <span className="h-12 w-12 shrink-0 rounded-lg border-2 border-dashed border-brand/25" />
                      )}
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                          {src ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </span>
                        <code className="block truncate text-[11px] text-ink-muted">{item.path}</code>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
