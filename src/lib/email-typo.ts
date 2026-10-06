// Email typo suggestions ("Did you mean gmail.com?"). The tables below mirror
// server-rateo/src/utils/emailHygiene.js and the app's src/utils/emailTypo.js
// and must be kept in sync. The server-only invalidTldFix is not ported.

// Known domain typos → the domain the user almost certainly meant. Whole-domain
// match only (no fuzzy matching) so real domains never get flagged.
const DOMAIN_FIXES: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmali.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.comm': 'gmail.com', 'googlemail.con': 'googlemail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yhoo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com', 'ymail.con': 'ymail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.con': 'outlook.com',
  'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com',
  'live.con': 'live.com', 'aol.con': 'aol.com', 'protonmail.con': 'protonmail.com',
};
// Bad top-level domains on ANY domain (hint only on the clients).
const TLD_FIXES: Record<string, string> = { con: 'com', cmo: 'com', comm: 'com', om: 'com' };

const has = (o: Record<string, string>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

function parseEmail(raw: string | null | undefined): { local: string; domain: string } | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  const parts = s.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { local: parts[0], domain: parts[1].toLowerCase() };
}

/** Suggested corrected address, or null when nothing looks wrong. */
export function suggestEmailFix(raw: string | null | undefined): string | null {
  const p = parseEmail(raw);
  if (!p) return null;
  if (has(DOMAIN_FIXES, p.domain)) return `${p.local}@${DOMAIN_FIXES[p.domain]}`;
  const dot = p.domain.lastIndexOf('.');
  if (dot < 0) return null;
  const tld = p.domain.slice(dot + 1);
  if (has(TLD_FIXES, tld)) return `${p.local}@${p.domain.slice(0, dot + 1)}${TLD_FIXES[tld]}`;
  return null;
}
