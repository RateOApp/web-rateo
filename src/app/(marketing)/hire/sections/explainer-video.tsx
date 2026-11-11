"use client";

import { useState } from "react";

import { trackMetaCustom } from "@/lib/meta-pixel";
import { Ic } from "./svg-icon";

const VIDEO_ID = "dZNNTPE-8qE";

/**
 * Employer explainer (YouTube Short) shown inside the phone mockup.
 * Click-to-load facade: no YouTube iframe/JS is fetched until the visitor presses play.
 */
export function ExplainerVideo() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="vid-frame"
        src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
        title="How hiring works on Rate’O"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="vid-cover"
      aria-label="Play video: how hiring works on Rate’O"
      onClick={() => {
        trackMetaCustom("HireVideoPlay", { location: "how" });
        setPlaying(true);
      }}
    >
      <span className="vid-eye">Employer explainer</span>
      <span className="vid-title">See how hiring works on Rate’O</span>
      <span className="vid-play">
        <Ic id="play" />
      </span>
      <span className="vid-hint">Tap to watch</span>
    </button>
  );
}
