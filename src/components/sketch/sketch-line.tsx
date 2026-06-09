type Point = {
  x: number;
  y: number;
};

type SketchLineProps = {
  from: Point;
  to: Point;
  active?: boolean;
  tone?: "sky" | "mint" | "amber" | "rose";
};

const markerByTone = {
  sky: "var(--marker-sky)",
  mint: "var(--marker-mint)",
  amber: "var(--marker-amber)",
  rose: "var(--marker-rose)",
};

export function SketchLine({ from, to, active, tone = "sky" }: SketchLineProps) {
  const d = `M ${from.x} ${from.y} C ${from.x + 44} ${from.y - 16}, ${to.x - 44} ${
    to.y + 18
  }, ${to.x} ${to.y}`;

  return (
    <g pointerEvents="none">
      {active ? (
        <path
          d={d}
          fill="none"
          stroke="var(--accent-sky-glow)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={9}
          opacity={0.2}
        />
      ) : null}
      <path
        d={d}
        fill="none"
        opacity={active ? 0.9 : 0.42}
        stroke={markerByTone[tone]}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 8 : 5}
        transform="translate(2 3)"
      />
      <path
        d={d}
        fill="none"
        opacity={active ? 1 : 0.74}
        stroke={active ? "var(--accent-sky)" : "var(--sketch-ink-muted)"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2 : 1.1}
      />
    </g>
  );
}
