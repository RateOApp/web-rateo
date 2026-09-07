"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  ExternalLink,
  Flag,
  HelpCircle,
  Loader2,
  LogOut,
  Lock,
  ScrollText,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { ShareAppButton } from "@/components/settings/share-app-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMe } from "@/hooks/use-me";
import { hardNavigate } from "@/lib/navigate";
import { authService } from "@/services/auth";

const ROW_CLASS =
  "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-brand-900 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-700" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
        {children}
      </div>
    </section>
  );
}

function LinkRow({
  href,
  label,
  icon,
  external,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={ROW_CLASS}
    >
      <RowIcon icon={icon} />
      <span className="flex-1">{label}</span>
      {external ? (
        <ExternalLink aria-hidden="true" className="size-4 text-muted-foreground" />
      ) : (
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      )}
    </Link>
  );
}

/** `/dashboard/settings` — the row list plus its dialogs. */
export function SettingsMenu() {
  const { data: me } = useMe();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await authService.logout();
    hardNavigate("/login");
  }

  function handleKyc() {
    if (me?.kycStatus === "verified") {
      toast.success("You are verified ✓", {
        description:
          "Your account has already been verified — no need to submit KYC again.",
      });
      return;
    }
    hardNavigate("/dashboard/kyc");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Section title="Account">
        <LinkRow
          href="/dashboard/profile/edit"
          label="Edit profile"
          icon={UserRound}
        />
        <LinkRow
          href="/dashboard/settings/password"
          label="Change password"
          icon={Lock}
        />
        <LinkRow
          href="/dashboard/settings/notifications"
          label="Notification"
          icon={Bell}
        />
        <button type="button" onClick={handleKyc} className={ROW_CLASS}>
          <RowIcon icon={BadgeCheck} />
          <span className="flex-1">KYC</span>
          <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
        </button>
      </Section>

      <Section title="Support">
        <LinkRow href="/dashboard/help" label="Help & Support" icon={HelpCircle} />
        <LinkRow
          href="https://rateo.ng/terms"
          label="Terms and Policies"
          icon={ScrollText}
          external
        />
      </Section>

      <Section title="Actions">
        <LinkRow href="/dashboard/report" label="Report a problem" icon={Flag} />
        <ShareAppButton />
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className={ROW_CLASS}
        >
          <RowIcon icon={LogOut} />
          <span className="flex-1">Log out</span>
        </button>
      </Section>

      <DeleteAccountDialog userId={me?._id} />

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={loggingOut}
              onClick={() => setLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
