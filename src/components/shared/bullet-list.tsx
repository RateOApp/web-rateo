/**
 * Bulleted list of free-text lines (job tasks, perks). Leading markdown-ish
 * bullets are stripped because scraped and pasted copy often carries them.
 *
 * Shared by the public job page and the company-side job summary so both render
 * responsibilities and perks identically.
 */
export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-700" />
          <span className="min-w-0 break-words">{item.replace(/^[•\-*]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  );
}
