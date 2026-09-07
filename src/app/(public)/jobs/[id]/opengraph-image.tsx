import { ImageResponse } from "next/og";

import { humanizeEmploymentType, isObjectId, jobCompanyName, jobSalaryLabel } from "@/lib/format";
import { jobsServer } from "@/services/jobs.server";
import { isImportedJob, type AnyJob } from "@/types/api";

/**
 * `ImageResponse` renders with Satori: no Tailwind classes, no CSS variables.
 * These literals mirror the tokens in `src/app/globals.css` —
 * brand-900 #113D3C, accent-600 #FC9D01, cream-50 #FFF5E1.
 */
const BRAND_900 = "#113D3C";
const ACCENT_600 = "#FC9D01";
const CREAM_50 = "#FFF5E1";

export const alt = "Job on Rate'O";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function JobOpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let job: AnyJob | null = null;
  if (isObjectId(id)) {
    job = await jobsServer
      .byId(id, { auth: false, next: { revalidate: 300 } })
      .catch(() => null);
  }

  const title = job?.title?.trim() || "Jobs on Rate'O";
  const company = job ? jobCompanyName(job) : "Find your next role";
  const type = job
    ? isImportedJob(job)
      ? humanizeEmploymentType(job.employmentType)
      : job.type?.trim() || null
    : null;
  // The OG renderer's built-in font has no glyph for "₦", so spell it out here.
  const salary = job ? jobSalaryLabel(job)?.replaceAll("₦", "NGN ") ?? null : null;
  const meta = job
    ? [job.location?.trim() || null, type, salary].filter(Boolean).join("  ·  ")
    : "";

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
            {company}
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
            {title}
          </div>
          {meta ? (
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
              {meta}
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
