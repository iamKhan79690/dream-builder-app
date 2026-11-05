import { useState, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { Check, CreditCard, Download, Eye, Lock, ShieldCheck, Truck } from "lucide-react";
import { AppShell } from "@/components/Layout";
import { Arrow, Button, Card, Field, Heading, LinkButton, Subtle } from "@/components/ui";
import { CURRENCY, PLANS, type PlanId } from "@/data/content";
import { useAppState } from "@/state/AppState";
import { cx, possessive } from "@/lib/text";
import { ROUTES } from "@/lib/routes";

const price = (n: number) => `${CURRENCY}${n.toLocaleString()}`;

export function PlansScreen() {
  const [, navigate] = useLocation();
  const choose = (id: PlanId) => {
    navigate(`${ROUTES.pay}?plan=${id}`);
  };

  return (
    <AppShell>
      <div className="text-center">
        <Heading>Bring This Story to Life</Heading>
        <Subtle className="mt-1">Choose how you'd like to keep your child's story.</Subtle>
      </div>
      <div className="mx-auto mt-12 grid w-full items-center gap-5 md:grid-cols-3 lg:gap-7">
        {PLANS.map((p) => (
          <Card key={p.id} className={cx("flex h-full min-h-[440px] flex-col p-6 sm:p-7", p.popular && "border-2 border-brand-ring md:-my-6 md:min-h-[520px]")}>
            {p.popular && (
              <span className="mx-auto mb-3 rounded-full bg-brand px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                Most Popular
              </span>
            )}
            <p className="text-sm font-bold text-ink">{p.title}</p>
            <p className="mt-2 font-display text-4xl font-bold text-ink">{price(p.price)}</p>
            <ul className="mt-5 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-ink-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {f}
                </li>
              ))}
            </ul>
            <Button variant={p.popular ? "primary" : "outline"} className="mt-6 w-full" onClick={() => choose(p.id)}>
              {p.cta} <Arrow />
            </Button>
          </Card>
        ))}
      </div>
      <div className="mt-12 flex flex-col items-center gap-2">
        <LinkButton href={ROUTES.dashboard} variant="ghost" className="h-9 bg-white px-4 shadow-sm">
          Not Now
        </LinkButton>
        <Subtle className="text-xs">Your child's story stays saved, even if you decide to purchase later.</Subtle>
      </div>
    </AppShell>
  );
}

type Method = "card" | "apple" | "google" | "other";

const METHODS: { id: Method; label: string; mark: ReactNode }[] = [
  { id: "card", label: "Credit or Debit Card", mark: <CreditCard className="h-4 w-4" /> },
  { id: "apple", label: "Apple Pay", mark: <span className="text-xs font-bold"> Pay</span> },
  { id: "google", label: "Google Pay", mark: <span className="text-xs font-bold">G Pay</span> },
  { id: "other", label: "Other approved payment methods", mark: <Lock className="h-4 w-4" /> },
];

export function PayScreen() {
  const [, navigate] = useLocation();
  const { heroName, updateParent } = useAppState();
  const planId = new URLSearchParams(window.location.search).get("plan") as PlanId | null;
  const plan = PLANS.find((p) => p.id === planId);
  const [method, setMethod] = useState<Method>("card");

  if (!plan) return <Redirect to={ROUTES.plans} />;
  const physical = plan.id !== "digital";
  const delivery = 0; // TBD with the print partner (Gelato) — shown as included for now.

  const pay = () => {
    updateParent({ order: { plan: plan.id, orderNumber: `DB-${Math.floor(10000 + Math.random() * 89999)}`, amount: plan.price + delivery } });
    navigate(ROUTES.success);
  };

  return (
    <AppShell>
      <div className="text-center">
        <Heading>Complete Your Order</Heading>
        <Subtle className="mt-1">You're one step away from bringing your child's story to life.</Subtle>
      </div>
      <div className="mx-auto mt-8 grid w-full max-w-[1000px] items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-bold text-ink">Choose Your Payment Method</h2>
            <div className="space-y-2">
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={cx(
                    "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm",
                    method === m.id ? "border-brand bg-brand-soft/50" : "border-ink/10",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-brand" />
                    {m.label}
                  </span>
                  <span className="text-ink-muted">{m.mark}</span>
                </label>
              ))}
            </div>
            {method === "card" && (
              <div className="mt-5">
                <Field id="card-name" label="Cardholder Name" placeholder="Name on card" autoComplete="cc-name" />
                <Field id="card-number" label="Card Number" placeholder="•••• •••• •••• ••••" inputMode="numeric" autoComplete="cc-number" />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="card-exp" label="Expiry Date" placeholder="MM/YY" autoComplete="cc-exp" />
                  <Field id="card-cvc" label="Security Code" placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" />
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-bold text-ink">{physical ? "Billing & Delivery Address" : "Billing Address"}</h2>
            <Field id="addr1" label="Address Line 1" placeholder="Apartment, suite, unit, etc." autoComplete="address-line1" />
            <Field id="addr2" label="Address Line 2 (Optional)" placeholder="Apartment, suite, unit, etc." autoComplete="address-line2" />
            <div className="grid grid-cols-2 gap-3">
              <Field id="city" label="City" placeholder="Dubai" autoComplete="address-level2" />
              <Field id="state" label="State / Emirate" placeholder="Dubai" autoComplete="address-level1" />
              <Field id="postal" label="Postal Code, if applicable" placeholder="e.g. 00000" autoComplete="postal-code" />
              <Field id="country" label="Country / Region" defaultValue="United Arab Emirates" autoComplete="country-name" />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-ink">Order Summary</h2>
            <dl className="space-y-2 text-sm">
              <Row k="Product" v={plan.title} />
              <Row k="Story" v={`${possessive(heroName)} Magical Journey`} />
              <Row k="Quantity" v="1" />
              <Row k="Subtotal" v={price(plan.price)} />
              {physical && <Row k="Delivery" v={delivery ? price(delivery) : "Included"} />}
              <div className="flex justify-between border-t border-ink/10 pt-3 font-bold">
                <dt>Total:</dt>
                <dd className="text-brand">{price(plan.price + delivery)}</dd>
              </div>
            </dl>
            <Button className="mt-5 w-full" onClick={pay}>
              Pay {price(plan.price + delivery)}
            </Button>
            <LinkButton href={ROUTES.plans} variant="outline" className="mt-2 w-full">
              Back to Plans
            </LinkButton>
          </Card>
          <Card className="p-4 text-center text-xs">
            <p className="flex items-center justify-center gap-1 text-ink-muted">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Your payment is processed securely.
            </p>
            <p className="mt-2 space-x-2 font-semibold text-brand">
              <a href="#">Refund Policy</a>
              <span className="text-ink-faint">•</span>
              <a href="#">Cancellation Policy</a>
              <span className="text-ink-faint">•</span>
              <a href="#">Contact Support</a>
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{k}:</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

export function SuccessScreen() {
  const { parent, heroName } = useAppState();
  const order = parent.order;
  if (!order) return <Redirect to={ROUTES.plans} />;
  const plan = PLANS.find((p) => p.id === order.plan)!;
  const physical = order.plan !== "digital";

  return (
    <AppShell>
      <div className="mx-auto mt-auto max-w-2xl text-center">
        <Heading>{physical ? "Your Order Is Confirmed!" : "Your Digital Storybook Is Ready!"}</Heading>
        <Subtle className="mt-2">
          {physical
            ? "Thank you for bringing your child's story to life. Your order has been received successfully."
            : "Thank you for bringing your child's imagination to life! Your payment was successful, and your digital storybook is ready to enjoy."}
        </Subtle>
      </div>
      <div className="mx-auto mb-auto mt-8 w-full max-w-[576px] space-y-4">
        <Card>
          <h2 className="mb-3 border-b border-ink/10 pb-3 text-xs font-extrabold uppercase tracking-wide text-ink">Order Details</h2>
          <dl className="space-y-2 text-sm">
            <Row k="Story" v={`${possessive(heroName)} Magical Journey`} />
            <Row k="Format" v={plan.title} />
            <Row k="Order Number" v={order.orderNumber} />
            <div className="flex justify-between">
              <dt className="text-ink-muted">Amount Paid:</dt>
              <dd className="font-bold text-brand">{price(order.amount)}</dd>
            </div>
          </dl>
        </Card>
        <Card className="bg-white/70 text-center">
          <p className="font-bold text-ink">{physical ? "Your Book Is Being Prepared" : "Your Child's Digital Story Is Ready"}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {physical ? (
              <Button>
                <Truck className="h-4 w-4" /> Track My Order
              </Button>
            ) : (
              <>
                <Button>
                  <Download className="h-4 w-4" /> Download Story
                </Button>
                <LinkButton href={ROUTES.book} variant="outline" className="border-ink/10">
                  <Eye className="h-4 w-4" /> View Story
                </LinkButton>
              </>
            )}
          </div>
        </Card>
        <div className="text-center">
          <LinkButton href={ROUTES.dashboard} variant="ghost">
            Go to Dashboard
          </LinkButton>
        </div>
      </div>
    </AppShell>
  );
}
