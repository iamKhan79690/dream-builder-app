import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Apple, Eye, EyeOff, Github } from "lucide-react";
import { AppShell, CenteredCard } from "@/components/Layout";
import { Arrow, Button, Card, CheckRow, Field } from "@/components/ui";
import { useAppState } from "@/state/AppState";
import { ROUTES } from "@/lib/routes";

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      id="password"
      label="Password"
      type={show ? "text" : "password"}
      placeholder="•••••••"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      trailing={
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-4 w-4 text-ink-muted" /> : <Eye className="h-4 w-4 text-ink-muted" />}
        </button>
      }
    />
  );
}

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
);

const PROVIDERS = [
  { name: "Google", mark: <GoogleMark /> },
  { name: "Apple", mark: <Apple className="h-4 w-4 fill-ink text-ink" aria-hidden /> },
  { name: "GitHub", mark: <Github className="h-4 w-4 text-ink" aria-hidden /> },
];

function SocialRow({ label }: { label: string }) {
  // Visual only until auth exists.
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-ink/10" />
        {label}
        <span className="h-px flex-1 bg-ink/10" />
      </div>
      <div className="flex justify-center gap-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.name}
            type="button"
            aria-label={`Continue with ${p.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white hover:bg-tile"
          >
            {p.mark}
          </button>
        ))}
      </div>
    </>
  );
}

function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppShell plainLogo>
      <CenteredCard>
        <Card className="w-full">
          <h1 className="mb-6 text-center font-display text-[26px] font-bold text-ink">{title}</h1>
          {children}
        </Card>
      </CenteredCard>
    </AppShell>
  );
}

export function SignupScreen() {
  const [, navigate] = useLocation();
  const { updateParent } = useAppState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [consent, setConsent] = useState(false);

  const canSubmit = name.trim() && email.includes("@") && password.length >= 8 && isAdult && consent;

  return (
    <AuthFrame title="Create your account">
      <Field id="name" label="Full Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field id="email" label="Email address" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField value={password} onChange={setPassword} />
      <CheckRow
        checked={isAdult}
        onChange={setIsAdult}
        title="Adult Age Verification Gate"
        desc="I verify that I am at least 18 years of age and legally authorized to supervise the child."
      />
      <CheckRow
        checked={consent}
        onChange={setConsent}
        title="COPPA & GDPR-K Parental Consent"
        desc="I give verified parental consent for my child to create stories in this encrypted, ad-free studio."
      />
      <Button
        className="mt-2 w-full"
        disabled={!canSubmit}
        onClick={() => {
          updateParent({ account: { name, email } });
          navigate(ROUTES.children);
        }}
      >
        Create Account <Arrow />
      </Button>
      <SocialRow label="Or sign up with" />
      <p className="mt-5 text-center text-xs text-ink-muted">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-bold text-ink underline">
          Log in here
        </Link>
      </p>
    </AuthFrame>
  );
}

export function LoginScreen() {
  const [, navigate] = useLocation();
  const { parent, updateParent } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <AuthFrame title="Log in">
      <Field id="email" label="Email Address" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField value={password} onChange={setPassword} />
      <div className="-mt-1 mb-5 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-ink-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-brand" />
          Remember me
        </label>
        <button type="button" className="text-ink-muted hover:text-ink">
          Forgot password?
        </button>
      </div>
      <Button
        className="w-full"
        disabled={!email.includes("@") || !password}
        onClick={() => {
          updateParent({ account: parent.account ?? { name: email.split("@")[0], email } });
          navigate(ROUTES.children);
        }}
      >
        Sign In <Arrow />
      </Button>
      <SocialRow label="Or continue with" />
      <p className="mt-5 text-center text-xs text-ink-muted">
        New here?{" "}
        <Link href={ROUTES.signup} className="font-bold text-ink underline">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  );
}
