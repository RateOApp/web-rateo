/**
 * Tiered copy for "how is my company rated?".
 *
 * Ported verbatim from app-rateo's `companyFeedbackCards` /
 * `companyNotRatedCard`. It is deliberately NOT the individual ladder in
 * `@/lib/rating-feedback`: employees rate a company on pay, growth and duty of
 * care, so the tiers name those, and an unrated company gets a reassuring line
 * rather than the bottom tier's "your rating is low".
 */

export type CompanyFeedback = { title: string; subtitle: string };

/** Shown until at least one staff rating exists. */
const NOT_RATED: CompanyFeedback = {
  title: 'No ratings yet 🌱',
  subtitle:
    "Nothing to worry about — your company just hasn't been rated yet. As your staff share their experience, your rating will appear here and grow over time.",
};

/** Ascending by `max`; the first tier whose ceiling clears the average wins. */
const TIERS: { max: number; feedback: CompanyFeedback }[] = [
  {
    max: 1.9,
    feedback: {
      title: 'Uh-oh! 😐',
      subtitle:
        'Your company rating is low. Employees feel key areas like career growth, fair pay, and duty of care need real improvement.',
    },
  },
  {
    max: 2.9,
    feedback: {
      title: "You're getting there! 👍",
      subtitle:
        'Staff see some effort. Keep working on professionalism, safety, and growth opportunities to build trust.',
    },
  },
  {
    max: 3.9,
    feedback: {
      title: 'Decent job! 👍',
      subtitle:
        "Your company is doing okay, but there's room to grow. Strengthen weaker areas like salary and career development.",
    },
  },
  {
    max: 4.5,
    feedback: {
      title: 'Great job! ⭐',
      subtitle:
        'Employees rate your company highly. Keep investing in growth and staff wellbeing to reach excellence.',
    },
  },
  {
    max: 5,
    feedback: {
      title: 'Outstanding! 🔥',
      subtitle:
        'Your company is rated excellently across the board. Employees value working here — keep it up!',
    },
  },
];

/**
 * Tier for a company's average. `total === 0` is the unrated card, not the
 * bottom tier - a new account has not been judged, it has just arrived.
 */
export function companyFeedback(
  average: number | null | undefined,
  total: number | null | undefined,
): CompanyFeedback {
  if (!total || typeof average !== 'number' || !Number.isFinite(average)) return NOT_RATED;
  const tier = TIERS.find((entry) => average <= entry.max);
  return tier ? tier.feedback : TIERS[TIERS.length - 1].feedback;
}

/**
 * "How you end contracts" split, from `user.contractEndSummary`.
 *
 * Hidden below one ending: a single immediate exit would otherwise read as
 * "100% immediate", which is technically true and wildly unfair.
 */
export function contractEndSplit(summary: {
  noticeCount?: number;
  immediateCount?: number;
} | null | undefined): {
  show: boolean;
  total: number;
  noticePct: number;
  immediatePct: number;
  label: string;
} {
  const noticeCount = summary?.noticeCount ?? 0;
  const immediateCount = summary?.immediateCount ?? 0;
  const total = noticeCount + immediateCount;
  const noticePct = total > 0 ? Math.round((noticeCount / total) * 100) : 0;
  const immediatePct = 100 - noticePct;

  return {
    show: total >= 1,
    total,
    noticePct,
    immediatePct,
    label: `${noticePct}% with notice · ${immediatePct}% immediate (${total} ${
      total === 1 ? 'ending' : 'endings'
    })`,
  };
}
