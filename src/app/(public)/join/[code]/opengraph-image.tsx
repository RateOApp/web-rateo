import { ImageResponse } from "next/og";

import { normaliseReferralCode } from "@/lib/referral-code";
import { referralsServer } from "@/services/referrals.server";

/**
 * `ImageResponse` renders with Satori: no Tailwind classes, no CSS variables.
 * These literals mirror the tokens in `src/app/globals.css` —
 * brand-900 #113D3C, accent-600 #FC9D01, cream-50 #FFF5E1.
 */
const BRAND_900 = "#113D3C";
const ACCENT_600 = "#FC9D01";
const CREAM_50 = "#FFF5E1";

export const alt = "Join Rate'O";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function JoinOpengraphImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = normaliseReferralCode((await params).code);

  const lookup = code
    ? await referralsServer
        .lookupCode(code, { auth: false, next: { revalidate: 300 } })
        .catch(() => null)
    : null;

  const name = lookup?.valid
    ? lookup.referrerName?.trim() ||
      (lookup.referrerRole === "company" ? "a company" : "a friend")
    : null;

  const headline = name ? `Join Rate'O — invited by ${name}` : "Join Rate'O";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BRAND_900,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: ACCENT_600, fontWeight: 600 }}>
            You&rsquo;re invited
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.15,
              color: CREAM_50,
              maxWidth: 1000,
            }}
          >
            {headline}
          </div>
          {lookup?.valid ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 36,
                letterSpacing: 8,
                fontWeight: 700,
                color: ACCENT_600,
              }}
            >
              {code}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 32,
                color: CREAM_50,
                opacity: 0.8,
                maxWidth: 1000,
              }}
            >
              Rate the places you have worked.
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
          }}
        >
          <div style={{ display: "flex", color: CREAM_50, fontWeight: 700 }}>
            Rate
            <span style={{ color: ACCENT_600 }}>&rsquo;O</span>
          </div>
          <div style={{ display: "flex", color: CREAM_50, opacity: 0.7 }}>app.rateo.ng</div>
        </div>
      </div>
    ),
    size,
  );
}
