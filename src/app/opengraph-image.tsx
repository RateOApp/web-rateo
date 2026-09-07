import { ImageResponse } from "next/og";

/**
 * Site-wide social card. `ImageResponse` renders with Satori, which supports
 * neither Tailwind classes nor CSS variables, so the brand colours are written
 * as literals here. They mirror the tokens in `src/app/globals.css`:
 * brand-900 #113D3C, brand-700 #005C5A, accent-600 #FC9D01, cream-50 #FFF5E1.
 */
const BRAND_900 = "#113D3C";
const ACCENT_600 = "#FC9D01";
const CREAM_50 = "#FFF5E1";

export const alt = "Rate'O — Jobs, companies and honest ratings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: BRAND_900,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: CREAM_50 }}>
          Rate
          <span style={{ color: ACCENT_600 }}>&rsquo;O</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 40,
            lineHeight: 1.3,
            color: CREAM_50,
            opacity: 0.85,
            maxWidth: 900,
          }}
        >
          Jobs, companies and honest workplace ratings.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 28,
            color: ACCENT_600,
          }}
        >
          app.rateo.ng
        </div>
      </div>
    ),
    size,
  );
}
