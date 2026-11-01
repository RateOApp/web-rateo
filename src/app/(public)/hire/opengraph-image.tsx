import { ImageResponse } from "next/og";

/** Employer-page social card; palette mirrors `src/app/opengraph-image.tsx`. */
const BRAND_900 = "#113D3C";
const ACCENT_600 = "#FC9D01";
const CREAM_50 = "#FFF5E1";

export const alt = "Hire people you can actually trust with Rate'O";
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
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: ACCENT_600 }}>
          Rate
          <span>&rsquo;O</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            color: CREAM_50,
            maxWidth: 1000,
          }}
        >
          Hire people you can actually trust.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 36,
            color: CREAM_50,
            opacity: 0.85,
          }}
        >
          Verified work reviews for Nigerian hiring
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 28, color: ACCENT_600 }}>
          app.rateo.ng/hire
        </div>
      </div>
    ),
    size,
  );
}
