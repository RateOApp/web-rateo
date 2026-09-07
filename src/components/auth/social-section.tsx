import { OrDivider } from "@/components/auth/or-divider";
import { SocialButtons, type SocialButtonsProps } from "@/components/auth/social-buttons";
import { clerkEnabled } from "@/lib/clerk";

/**
 * Divider + provider buttons. The whole block disappears (divider included)
 * when Clerk is not configured, so the form does not end in a dangling rule.
 */
export function SocialSection(props: SocialButtonsProps) {
  if (!clerkEnabled) return null;

  return (
    <>
      <OrDivider />
      <SocialButtons {...props} />
    </>
  );
}
