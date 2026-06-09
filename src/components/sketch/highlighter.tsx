import { cn } from "@/lib/utils";

type HighlighterProps = {
  children: React.ReactNode;
  tone?: "sky" | "mint" | "amber" | "rose";
  className?: string;
};

const toneClass = {
  sky: "before:bg-[var(--marker-sky)]",
  mint: "before:bg-[var(--marker-mint)]",
  amber: "before:bg-[var(--marker-amber)]",
  rose: "before:bg-[var(--marker-rose)]",
};

export function Highlighter({ children, tone = "sky", className }: HighlighterProps) {
  return (
    <span
      className={cn(
        "relative isolate inline-block before:absolute before:-left-[0.12em] before:-right-[0.16em] before:bottom-[0.04em] before:-z-10 before:h-[0.58em] before:translate-x-[3px] before:translate-y-[2px] before:-rotate-1 before:rounded-[3px_6px_4px_5px] before:drop-shadow-[0_0_10px_rgba(73,207,255,0.18)]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
