import type { CSSProperties } from "react";

/** Sprite icon: `<svg><use href="#id"/></svg>` with the landing page's `.i` class by default. */
export function Ic({
  id,
  className = "i",
  size,
}: {
  id: string;
  className?: string;
  size?: number;
}) {
  return (
    <svg className={className || undefined} width={size} height={size}>
      <use href={`#${id}`} />
    </svg>
  );
}

export function Stars({ style }: { style?: CSSProperties }) {
  return (
    <span className="stars" style={style}>
      {[0, 1, 2, 3, 4].map((n) => (
        <Ic key={n} id="star" className="" />
      ))}
    </span>
  );
}
