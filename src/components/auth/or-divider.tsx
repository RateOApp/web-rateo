type OrDividerProps = {
  /** Mobile says "Or sign in with" / "Or Register with"; web keeps one voice. */
  label?: string;
};

/** A rule with a label in the middle, between the email form and social sign-in. */
export function OrDivider({ label = "or continue with" }: OrDividerProps) {
  return (
    <div className="relative my-6" role="separator" aria-label={label}>
      <div className="absolute inset-0 top-1/2 h-px bg-border" />
      <span className="relative mx-auto block w-fit bg-card px-3 text-xs text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
