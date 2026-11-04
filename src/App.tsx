import { useEffect, useState, type ReactNode } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { AppStateProvider, useAppState } from "@/state/AppState";
import { redirectFor } from "@/lib/flow";
import { ROUTES } from "@/lib/routes";
import { LoginScreen, SignupScreen } from "@/screens/parent/Auth";
import { AddChildScreen, ChildrenScreen, HandoverScreen } from "@/screens/parent/Children";
import { ReviewScreen } from "@/screens/parent/Review";
import { LibraryScreen, StartScreen } from "@/screens/story/Start";
import { AuthorScreen, FormatScreen, StyleScreen } from "@/screens/story/Setup";
import { DreamScreen, HeroNameScreen, HeroScreen, StrengthScreen, ToolsScreen } from "@/screens/story/Character";
import { ActScreen, GateScreen, RestScreen } from "@/screens/story/Acts";
import { BookScreen, DoneScreen, GeneratingScreen, ReadyScreen } from "@/screens/story/Reveal";
import { PayScreen, PlansScreen, SuccessScreen } from "@/screens/checkout/Checkout";
import { ScreenIndex } from "@/screens/ScreenIndex";
import { AssetChecklist } from "@/screens/AssetChecklist";

/** Keeps visitors on the website's path: sign up → child setup → story steps in order → checkout. */
function FlowGuard({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const { story, parent, mode } = useAppState();
  const [preview, setPreview] = useState(isPreview);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  // Opening /screens turns on preview mode for this tab: every screen opens directly.
  useEffect(() => {
    if (path === "/screens" && !preview) {
      setPreviewFlag(true);
      setPreview(true);
    }
  }, [path, preview]);

  if (path.startsWith("/screens")) return <>{children}</>;
  if (preview) {
    return (
      <>
        {children}
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-card">
          <Link href="/screens" className="hover:underline">
            Preview mode
          </Link>
          <span className="text-white/40">·</span>
          <button
            type="button"
            className="text-amber-300 hover:underline"
            onClick={() => {
              setPreviewFlag(false);
              setPreview(false);
            }}
          >
            Exit
          </button>
        </div>
      </>
    );
  }
  const target = redirectFor(path, story, parent, mode);
  return target && target !== path ? <Redirect to={target} replace /> : <>{children}</>;
}

const PREVIEW_KEY = "dreamBuilder.preview";

function isPreview(): boolean {
  try {
    return sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

function setPreviewFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(PREVIEW_KEY, "1");
    else sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    // sessionStorage unavailable — preview lasts until reload.
  }
}

export function App() {
  return (
    <AppStateProvider>
      <FlowGuard>
      <Switch>
        <Route path={ROUTES.start} component={StartScreen} />
        <Route path={ROUTES.library} component={LibraryScreen} />
        <Route path={ROUTES.signup} component={SignupScreen} />
        <Route path={ROUTES.login} component={LoginScreen} />
        <Route path={ROUTES.children} component={ChildrenScreen} />
        <Route path={ROUTES.addChild} component={AddChildScreen} />
        <Route path={ROUTES.handover} component={HandoverScreen} />
        <Route path={ROUTES.author} component={AuthorScreen} />
        <Route path={ROUTES.format} component={FormatScreen} />
        <Route path={ROUTES.style} component={StyleScreen} />
        <Route path={ROUTES.hero} component={HeroScreen} />
        <Route path={ROUTES.heroName} component={HeroNameScreen} />
        <Route path={ROUTES.strength} component={StrengthScreen} />
        <Route path={ROUTES.tools} component={ToolsScreen} />
        <Route path={ROUTES.dream} component={DreamScreen} />
        <Route path="/story/act/:act/:part" component={ActScreen} />
        <Route path={ROUTES.rest} component={RestScreen} />
        <Route path={ROUTES.gate} component={GateScreen} />
        <Route path={ROUTES.generating} component={GeneratingScreen} />
        <Route path={ROUTES.ready} component={ReadyScreen} />
        <Route path={ROUTES.book} component={BookScreen} />
        <Route path={ROUTES.done} component={DoneScreen} />
        <Route path={ROUTES.review} component={ReviewScreen} />
        <Route path={ROUTES.plans} component={PlansScreen} />
        <Route path={ROUTES.pay} component={PayScreen} />
        <Route path={ROUTES.success} component={SuccessScreen} />
        <Route path="/screens" component={ScreenIndex} />
        <Route path="/screens/assets" component={AssetChecklist} />
        <Route>
          <StartScreen />
        </Route>
      </Switch>
      </FlowGuard>
    </AppStateProvider>
  );
}
