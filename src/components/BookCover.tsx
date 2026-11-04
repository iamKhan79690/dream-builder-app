import { Bookmark } from "lucide-react";
import { cx } from "@/lib/text";
import { AssetSlot } from "./ui";

export function BookCover({
  title,
  author,
  edition,
  asset,
  assetSrc,
  className,
}: {
  title: string;
  author: string;
  edition: "Explorer" | "Creator";
  /** Cover artwork description; omit for the blank "Storybook" cover. */
  asset?: string;
  assetSrc?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative flex aspect-[440/552] w-[min(100%,440px,calc((100vh_-_280px)_*_0.8))] flex-col items-center overflow-hidden rounded-r-md rounded-l-sm bg-gradient-to-b from-[#6A4BE0] to-[#5236C9] px-8 pb-6 pt-8 text-center text-white shadow-[16px_28px_50px_-16px_rgba(40,20,120,0.45)]",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-3.5 bg-black/15" aria-hidden />
      <span className="absolute right-5 top-0 flex h-10 w-6 items-end justify-center bg-amber-400 pb-1.5">
        <Bookmark className="h-3 w-3 fill-white text-white" aria-hidden />
      </span>
      <span className="rounded-full bg-[#3B24A0]/60 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">
        {edition} Edition
      </span>
      <h2 className="mt-5 font-display text-4xl font-medium leading-[1.1] sm:text-[44px]">{title}</h2>
      <p className="mt-3 text-sm font-semibold text-white/90">{author}</p>
      {asset && <AssetSlot label={asset} src={assetSrc} className={assetSrc ? "-mb-2 mt-2 min-h-0 w-full flex-1" : "mt-4 min-h-0 w-full flex-1 border-white/40 bg-white/10 text-white/80"} />}
    </div>
  );
}
