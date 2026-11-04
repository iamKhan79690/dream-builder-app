import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, ImageIcon } from "lucide-react";
import { cx } from "@/lib/text";

type Variant = "primary" | "outline" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/40",
  outline: "border border-ink/30 bg-white text-ink hover:bg-tile disabled:opacity-50",
  ghost: "text-ink hover:bg-tile disabled:opacity-50",
};

// Figma buttons: 44px tall, 10px radius, 14px bold label.
const BASE =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-6 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cx(BASE, VARIANTS[variant], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(BASE, VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}

/** Trailing arrow used on forward buttons. */
export const Arrow = () => <ArrowRight className="h-4 w-4" aria-hidden />;

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-3xl border border-ink/5 bg-white p-6 shadow-card sm:p-8", className)}>{children}</div>;
}

export function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cx("font-display text-[26px] font-bold leading-tight text-ink sm:text-[30px] sm:leading-9", className)}>{children}</h1>;
}

export function Subtle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-sm text-ink-muted", className)}>{children}</p>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 mt-6 text-base font-bold text-ink">{children}</h2>;
}

/**
 * Artwork slot: shows `src` when the image exists, otherwise a dashed
 * placeholder naming the expected asset.
 */
export function AssetSlot({
  label,
  src,
  cover,
  className,
}: {
  label: string;
  src?: string;
  /** Fill the slot (cropping) instead of fitting the whole image. */
  cover?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cx("flex items-center justify-center overflow-hidden", className, "border-0 bg-transparent p-0")}>
        <img src={src} alt={label} loading="lazy" className={cx("h-full w-full", cover ? "object-cover" : "object-contain")} />
      </div>
    );
  }
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/25 bg-brand-soft/40 p-4 text-center text-xs font-semibold text-brand/70",
        className,
      )}
      role="img"
      aria-label={`Placeholder: ${label}`}
    >
      <ImageIcon className="h-6 w-6" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function OptionCard({
  title,
  desc,
  selected,
  disabled,
  onClick,
  asset,
  assetSrc,
  icon,
  badge,
  centered,
  compact,
  coverArt,
  className,
}: {
  title: string;
  desc?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Label for the artwork slot; shows `assetSrc` when available. */
  asset?: string;
  assetSrc?: string;
  icon?: ReactNode;
  badge?: string;
  /** Small centred tile (feelings, tools, pronouns). */
  centered?: boolean;
  /** Smaller text for three-column grids (strengths). */
  compact?: boolean;
  /** Crop the artwork to fill its box (scene previews) instead of fitting it. */
  coverArt?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "relative flex flex-col rounded-2xl border-[1.5px] bg-tile text-left transition-colors",
        centered ? "items-center px-2 py-4 text-center" : compact ? "p-3" : "p-4 sm:p-5",
        selected ? "border-brand" : "border-transparent hover:border-brand/30",
        disabled && "cursor-not-allowed opacity-45 hover:border-transparent",
        className,
      )}
    >
      {icon && <span className={cx("flex", centered ? "mb-3 h-8 items-center" : compact ? "mb-3 h-6" : "mb-4 h-6")}>{icon}</span>}
      <span
        className={cx(
          "font-bold text-ink",
          centered ? "font-display text-sm leading-[14px]" : compact ? "text-sm leading-5" : "text-[17px] leading-7",
        )}
      >
        {title}
      </span>
      {desc && (
        <span className={cx("text-ink-muted", centered ? "mt-2 text-xs leading-3" : compact ? "mt-1 text-xs leading-4" : "text-[13px] leading-5")}>
          {desc}
        </span>
      )}
      {asset && <AssetSlot label={asset} src={assetSrc} cover={coverArt} className={cx("mt-4 min-h-36 flex-1", coverArt && "rounded-lg")} />}
      {badge && (
        <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink-muted">
          {badge}
        </span>
      )}
    </button>
  );
}

export function ChapterPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-brand/25 bg-white px-4 text-xs font-bold text-ink shadow-sm sm:h-12">
      <span className="text-brand">✦</span>
      {children}
    </span>
  );
}

export function Progress({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-6 flex gap-2" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("h-1.5 flex-1 rounded-full", i < current ? "bg-brand" : "bg-white")} />
      ))}
    </div>
  );
}

export function Chips({ items, onPick, active }: { items: string[]; onPick: (v: string) => void; active?: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className={cx(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            active === item ? "border-brand bg-brand-soft text-brand" : "border-ink/15 bg-white text-ink hover:border-brand/40",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border border-ink/10 px-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none";

export function Field({
  label,
  id,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; trailing?: ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input id={id} className={cx(INPUT, "h-11 bg-white", trailing ? "pr-10" : undefined)} {...props} />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}

/** 54px input. `filled` gives the grey field used for names in Figma. */
export function TextInput({ filled, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { filled?: boolean }) {
  return <input className={cx(INPUT, "h-[54px]", filled ? "bg-tile" : "bg-white", className)} {...props} />;
}

export function CheckRow({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl bg-tile p-3">
      <span
        className={cx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-brand bg-brand text-white" : "border-ink/30 bg-white",
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-ink-muted">{desc}</span>
      </span>
    </label>
  );
}

/** Back / Continue footer used on every wizard card. */
export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  nextDisabled,
  extra,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {extra}
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <Arrow />
        </Button>
      </div>
    </div>
  );
}
