"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, ExternalLink, Flag, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar, displayName } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useChatProfile } from "@/hooks/use-messages";
import { getApiErrorMessage } from "@/lib/api/client";
import { messagesService } from "@/services/messages";

type ChatProfileSheetProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `true` when this account has blocked them (from my own `/users/:me/full`). */
  blocked: boolean;
};

/**
 * The profile sheet behind the thread header's menu: who this is, plus the
 * block and report actions. Mirrors mobile's ChatProfileScreen, including its
 * copy.
 */
export function ChatProfileSheet({ userId, open, onOpenChange, blocked }: ChatProfileSheetProps) {
  const queryClient = useQueryClient();
  const { data: profile, isPending } = useChatProfile(open ? userId : null);

  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const name = profile ? displayName(profile) : "Profile";
  const isCompany = profile?.role === "company";
  const profileHref = isCompany ? `/companies/${userId}` : `/dashboard/talent/${userId}`;

  async function toggleBlock() {
    if (busy) return;
    setBusy(true);
    try {
      if (blocked) {
        await messagesService.unblockUser(userId);
        toast.success("User unblocked");
      } else {
        await messagesService.blockUser(userId);
        toast.success("User blocked");
      }
      // My own full profile carries `blockedUsers`, which drives the banner.
      await queryClient.invalidateQueries({ queryKey: ["chatProfile"] });
      setConfirmBlock(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${blocked ? "unblock" : "block"} user`));
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for reporting.");
      return;
    }
    setBusy(true);
    try {
      await messagesService.reportUser(userId, reason.trim());
      toast.success("User reported successfully. We will review your report.");
      setReason("");
      setReportOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to report user."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>User Profile</SheetTitle>
            <SheetDescription className="sr-only">
              Profile, block and report actions for this conversation.
            </SheetDescription>
          </SheetHeader>

          {isPending || !profile ? (
            <div className="flex flex-col gap-3 px-4">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <div className="flex flex-col gap-5 px-4 pb-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <UserAvatar user={profile} size="lg" className="size-20!" />
                <p className="text-lg font-semibold text-brand-900">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {isCompany ? "Company" : "Individual"}
                </p>
                {profile.location?.trim() ? (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                    {profile.location.trim()}
                  </p>
                ) : null}
              </div>

              <section>
                <h3 className="mb-1 text-sm font-semibold text-brand-900">About</h3>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {profile.bio?.trim() || profile.description?.trim() || "No bio available."}
                </p>
              </section>

              {profile.role === "individual" && profile.skills?.length ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-brand-900">Skills</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" size="lg" className="h-11 w-full">
                  <Link href={profileHref} onClick={() => onOpenChange(false)}>
                    <ExternalLink aria-hidden="true" />
                    View profile
                  </Link>
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant={blocked ? "outline" : "destructive"}
                  className="h-11 w-full"
                  disabled={busy}
                  onClick={() => setConfirmBlock(true)}
                >
                  {blocked ? (
                    <ShieldCheck aria-hidden="true" />
                  ) : (
                    <Ban aria-hidden="true" />
                  )}
                  {blocked ? "Unblock User" : "Block User"}
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 w-full text-destructive"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag aria-hidden="true" />
                  Report User
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmBlock} onOpenChange={(next) => (busy ? null : setConfirmBlock(next))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{blocked ? "Unblock User" : "Block User"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {blocked ? "unblock" : "block"} this user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => setConfirmBlock(false)}
            >
              Cancel
            </Button>
            <Button
              variant={blocked ? "default" : "destructive"}
              size="lg"
              disabled={busy}
              onClick={() => void toggleBlock()}
            >
              {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={(next) => (busy ? null : setReportOpen(next))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please tell us why you are reporting this user.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submitReport(event)} className="flex flex-col gap-3">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for reporting..."
              aria-label="Reason for reporting"
              rows={4}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={busy}
                onClick={() => setReportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="bg-brand-700 text-white"
                disabled={busy || !reason.trim()}
              >
                {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
                Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
