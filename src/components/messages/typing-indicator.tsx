/** "Typing..." under the last bubble, driven by the `typing` socket event. */
export function TypingIndicator({ name }: { name?: string }) {
  return (
    <li className="flex justify-start">
      <span
        className="flex items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 text-xs text-muted-foreground"
        aria-label={name ? `${name} is typing` : "Typing"}
      >
        <span aria-hidden="true" className="flex gap-0.5">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
        </span>
        Typing...
      </span>
    </li>
  );
}
