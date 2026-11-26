/**
 * Candidate skills are short tags, not sentences. Pasted lists
 * ("• Recruitment • Payroll", "Excel, Word") are split into separate tags.
 *
 * Mirrors server-rateo/src/utils/skills.js (which enforces the same limits) and
 * app-rateo/src/utils/skills.js - keep the three in sync.
 */

export const MAX_SKILL_LENGTH = 40;
export const MAX_SKILLS = 20;

// "/" and "&" do NOT split ("UI/UX", "Sales & Marketing" are single skills), and
// nothing inside brackets does ("HRIS (e.g. Workday, BambooHR)" stays one skill).
const SEPARATORS = /[\n\r,;|•·●▪◦‣∙]+/;
const SEPARATOR_CHAR = /[\n\r,;|•·●▪◦‣∙]/;

/** Split on separators that are outside (), [] and {}. */
function splitOutsideBrackets(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if ((ch === ')' || ch === ']' || ch === '}') && depth > 0) depth -= 1;
    if (depth === 0 && SEPARATOR_CHAR.test(ch)) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

export function cleanSkill(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:[-*–—]+|\d+[.)])\s*/, '')
    .replace(/[.\s]+$/, '')
    .trim();
}

export function splitSkillText(text: string): string[] {
  return (
    splitOutsideBrackets(text)
      // An unclosed bracket can swallow the rest of a pasted list; if a piece is
      // still over the limit, fall back to splitting it on every separator.
      .flatMap((part) => (cleanSkill(part).length > MAX_SKILL_LENGTH ? part.split(SEPARATORS) : [part]))
      .map(cleanSkill)
      .filter(Boolean)
  );
}

export type AddSkillsResult = { skills: string[]; error?: string };

/**
 * Add the text typed into the "new skill" box to `current`: split it, drop
 * duplicates (case-insensitive), and enforce the length/count caps.
 * On error, `skills` is `current` unchanged.
 */
export function addSkillsFromText(current: string[], text: string): AddSkillsResult {
  const incoming = splitSkillText(text);
  if (!incoming.length) return { skills: current };

  const tooLong = incoming.find((skill) => skill.length > MAX_SKILL_LENGTH);
  if (tooLong) {
    return {
      skills: current,
      error: `Keep each skill under ${MAX_SKILL_LENGTH} characters. Separate several skills with commas.`,
    };
  }

  const seen = new Set(current.map((skill) => skill.toLowerCase()));
  const next = [...current];
  for (const skill of incoming) {
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(skill);
  }

  if (next.length > MAX_SKILLS && next.length > current.length) {
    return {
      skills: current,
      error: `You can add up to ${MAX_SKILLS} skills. Remove some before adding more.`,
    };
  }
  return { skills: next };
}

/**
 * Split every stored entry and drop case-insensitive duplicates, keeping order.
 * Used to show legacy pasted lists as separate tags (the server does the same on save).
 */
export function splitSkillList(list: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of list ?? []) {
    for (const skill of splitSkillText(String(entry ?? ''))) {
      const key = skill.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(skill);
    }
  }
  return out;
}
