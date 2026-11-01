"use client";

import Link from "next/link";
import { Reveal } from "./reveal";
import { useState, type ReactNode } from "react";

type Cat = "tech" | "design" | "sales" | "ops" | "finance";
type Filter = "all" | Cat;

type Candidate = {
  name: string;
  role: string;
  city: string;
  rating: number;
  reviews: number;
  skills: string[];
  quote: string;
  cat: Cat;
  accent: string;
  avatar: ReactNode;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tech", label: "Tech" },
  { id: "design", label: "Design" },
  { id: "sales", label: "Sales" },
  { id: "ops", label: "Operations & HR" },
  { id: "finance", label: "Finance" },
];

// Sample profiles for illustration only.
const CANDIDATES: Candidate[] = [
  {
    name: "Adaeze O.",
    role: "Product Manager",
    city: "Lagos",
    rating: 4.9,
    reviews: 18,
    skills: ["Roadmapping","Agile","Analytics"],
    quote: "Proactive, approachable and full of ideas that moved our projects forward.",
    cat: "tech",
    accent: "#1C6F66",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#FCE3B8"/><path d="M20 34C18 10 54 10 52 34L54 56 18 56Z" fill="#1a1208"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#123C38"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#8D5524"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#8D5524"/><path d="M23 31C23 17 30 14 36 14S49 17 49 31C46 25 41 23 36 23S26 25 23 31Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Tunde B.",
    role: "Software Engineer",
    city: "Lagos",
    rating: 4.8,
    reviews: 24,
    skills: ["React","Node.js","APIs"],
    quote: "Ships clean work on time and genuinely lifts the whole team.",
    cat: "tech",
    accent: "#F89C1C",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#CFE3DF"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#F89C1C"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#6F4222"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#6F4222"/><path d="M23.5 31C22 16 29 12.5 36 12.5S50 16 48.5 31C46 24.5 41 22 36 22S26 24.5 23.5 31Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Chioma E.",
    role: "Operations Lead",
    city: "Abuja",
    rating: 4.7,
    reviews: 15,
    skills: ["Logistics","Process","Reporting"],
    quote: "Calm under pressure and brilliant at making teams run smoothly.",
    cat: "ops",
    accent: "#2B6F68",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#FCE3B8"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#2B6F68"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#A9744F"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#A9744F"/><path d="M23.5 31C22 16 29 12.5 36 12.5S50 16 48.5 31C46 24.5 41 22 36 22S26 24.5 23.5 31Z" fill="#1a1208"/><circle cx="36" cy="10" r="6" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Ibrahim Y.",
    role: "Sales Manager",
    city: "Kano",
    rating: 4.8,
    reviews: 21,
    skills: ["B2B Sales","Negotiation","CRM"],
    quote: "Consistently beat targets and built lasting client relationships.",
    cat: "sales",
    accent: "#141414",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#F6D9A8"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#141414"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#5C3A21"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#5C3A21"/><path d="M23.5 31C22 16 29 12.5 36 12.5S50 16 48.5 31C46 24.5 41 22 36 22S26 24.5 23.5 31Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Ngozi A.",
    role: "Brand Designer",
    city: "Lagos",
    rating: 4.9,
    reviews: 12,
    skills: ["Branding","Figma","Motion"],
    quote: "Creative, quick to take feedback, and a joy to collaborate with.",
    cat: "design",
    accent: "#F89C1C",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#DCE9E5"/><circle cx="36" cy="25" r="18" fill="#1a1208"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#F89C1C"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#7A4A25"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#7A4A25"/><path d="M24 29C25 21 30 19 36 19S47 21 48 29C45 25 41 24 36 24S27 25 24 29Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Samuel K.",
    role: "Financial Analyst",
    city: "Port Harcourt",
    rating: 4.7,
    reviews: 17,
    skills: ["Modelling","Excel","Forecasting"],
    quote: "Accurate, detail-driven and always ready with the numbers.",
    cat: "finance",
    accent: "#1C6F66",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#FCE3B8"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#2B6F68"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#6F4222"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#6F4222"/><path d="M23.5 31C22 16 29 12.5 36 12.5S50 16 48.5 31C46 24.5 41 22 36 22S26 24.5 23.5 31Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Folake D.",
    role: "HR Business Partner",
    city: "Ibadan",
    rating: 4.8,
    reviews: 19,
    skills: ["Recruitment","Culture","Policy"],
    quote: "Fair, trusted by staff and management, and a true people person.",
    cat: "ops",
    accent: "#2B6F68",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#CFE3DF"/><path d="M20 34C18 10 54 10 52 34L54 56 18 56Z" fill="#1a1208"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#141414"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#8D5524"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#8D5524"/><path d="M23 31C23 17 30 14 36 14S49 17 49 31C46 25 41 23 36 23S26 25 23 31Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    name: "Emeka N.",
    role: "Data Analyst",
    city: "Enugu",
    rating: 4.6,
    reviews: 11,
    skills: ["SQL","Power BI","Python"],
    quote: "Turns messy data into clear decisions the team can act on.",
    cat: "tech",
    accent: "#141414",
    avatar: (
      <svg viewBox="0 0 72 72" width="100%" height="100%" role="img" aria-label="Candidate avatar"><rect width="72" height="72" fill="#F6D9A8"/><path d="M6 74C6 56 22 51 36 51S66 56 66 74Z" fill="#123C38"/><rect x="30" y="42" width="12" height="13" rx="4" fill="#A9744F"/><ellipse cx="36" cy="32" rx="12" ry="14" fill="#A9744F"/><path d="M23.5 31C22 16 29 12.5 36 12.5S50 16 48.5 31C46 24.5 41 22 36 22S26 24.5 23.5 31Z" fill="#1a1208"/><circle cx="31.5" cy="33" r="1.6" fill="#1a1208"/><circle cx="40.5" cy="33" r="1.6" fill="#1a1208"/><path d="M31.5 39.5Q36 43 40.5 39.5" fill="none" stroke="#1a1208" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
];

export function TalentGrid() {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <>
      <Reveal className="chips" role="group" aria-label="Filter talent">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </Reveal>
      <Reveal className="tg">
        {CANDIDATES.map((c) => (
          <article
            key={c.name}
            className="tc"
            data-cat={c.cat}
            hidden={!(filter === "all" || c.cat === filter)}
          >
            <div className="tb" style={{ background: c.accent }} />
            <div className="av">{c.avatar}</div>
            <div className="bd">
              <h3>
                {c.name}
                <svg className="i" aria-label="Verified">
                  <use href="#shield" />
                </svg>
              </h3>
              <div className="rl">
                {c.role} · {c.city}
              </div>
              <div className="rt">
                <svg>
                  <use href="#star" />
                </svg>
                {c.rating.toFixed(1)}
                <span>({c.reviews} reviews)</span>
              </div>
              <div className="sk">
                {c.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <q>“{c.quote}”</q>
              <Link className="more" href="/register/company">
                See more
                <svg className="i">
                  <use href="#arrow" />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </Reveal>
    </>
  );
}
