"use client";

import { useEffect, useRef, useState } from "react";

export function ThemeToggle() {
  const ref = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = ref.current?.closest(".hire");
    // Sync from the attribute set by the pre-paint script.
    setDark(root?.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const root = ref.current?.closest(".hire");
    const next = dark ? "light" : "dark";
    root?.setAttribute("data-theme", next);
    try {
      localStorage.setItem("rateo-theme", next);
    } catch {}
    setDark(next === "dark");
  }

  return (
    <button
      ref={ref}
      className="theme"
      type="button"
      id="themeBtn"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      onClick={toggle}
    >
      <svg className="i moon">
        <use href="#moon" />
      </svg>
      <svg className="i sun">
        <use href="#sun" />
      </svg>
    </button>
  );
}
