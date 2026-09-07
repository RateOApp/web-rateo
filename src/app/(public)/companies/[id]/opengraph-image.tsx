import { ImageResponse } from "next/og";

import { isObjectId } from "@/lib/format";
import { averageRating, formatRating } from "@/lib/rating";
import { companiesServer } from "@/services/companies.server";
import type { User } from "@/types/api";

/**
 * `ImageResponse` renders with Satori: no Tailwind classes, no CSS variables.
 * These literals mirror the tokens in `src/app/globals.css` —
 * brand-900 #113D3C, accent-600 #FC9D01, cream-50 #FFF5E1.
 */
const BRAND_900 = "#113D3C";
const ACCENT_600 = "#FC9D01";
const CREAM_50 = "#FFF5E1";

export const alt = "Company on Rate'O";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CompanyOpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let company: User | null = null;
  let rating = "";

  if (isObjectId(id)) {
    company = await companiesServer
      .byId(id, { auth: false, next: { revalidate: 300 } })
      .catch(() => null);

    if (company?.role !== "company") company = null;

    if (company) {
      const reviews = await companiesServer
        .reviews(id, { auth: false, next: { revalidate: 300 } })
        .catch(() => []);
      const average = company.overallRating ?? averageRating(reviews);
      if (average > 0) {
        rating = `★ ${formatRating(average)} · ${reviews.length} ${
          reviews.length === 1 ? "rating" : "ratings"
        }`;
      }
    }
  }

  const name = company?.companyName?.trim() || "Companies on Rate'O";
  const industry = company?.industry?.trim() || "Honest workplace ratings";

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
            {industry}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.15,
              color: CREAM_50,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>
          {rating ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 34,
                color: ACCENT_600,
              }}
            >
              {rating}
            </div>
          ) : null}
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
