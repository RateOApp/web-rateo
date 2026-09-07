"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { NotificationRow } from "@/components/notifications/notification-row";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NOTIFICATIONS_KEY, useNotifications } from "@/hooks/use-notifications";
import { getApiErrorMessage } from "@/lib/api/client";
import { notificationsService } from "@/services/notifications";
import {
  NOTIFICATION_FALLBACK_ROUTE,
  NOTIFICATION_ROUTES,
  type AppNotification,
} from "@/types/dashboard";

export function NotificationsList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const { data, isLoading } = useNotifications();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const notifications = data ?? [];
  const unread = notifications.filter((notification) => !notification.read).length;

  function patchCache(update: (list: AppNotification[]) => AppNotification[]) {
    queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (old) =>
      Array.isArray(old) ? update(old) : old,
    );
  }

  async function handleOpen(notification: AppNotification) {
    if (!notification.read) {
      patchCache((list) =>
        list.map((entry) =>
          entry._id === notification._id ? { ...entry, read: true } : entry,
        ),
      );
      try {
        await notificationsService.markRead(notification._id);
      } catch {
        // Non-fatal: the row is already marked locally and the next poll heals it.
      }
    }

    const type = notification.type ?? "";
    // Messages sit behind the KYC gate, exactly like the tab bar entry does.
    if (type === "message" && !kyc.requireVerified()) return;

    router.push(NOTIFICATION_ROUTES[type] ?? NOTIFICATION_FALLBACK_ROUTE);
  }

  async function handleDelete(notification: AppNotification) {
    if (deletingId) return;
    setDeletingId(notification._id);
    try {
      await notificationsService.remove(notification._id);
      patchCache((list) => list.filter((entry) => entry._id !== notification._id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkAll() {
    if (markingAll || !unread) return;
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      patchCache((list) => list.map((entry) => ({ ...entry, read: true })));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not mark all as read"));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything that happened while you were away."
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              size="lg"
              className="h-10"
              disabled={markingAll}
              onClick={() => void handleMarkAll()}
            >
              <CheckCheck aria-hidden="true" />
              Mark all as read
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl bg-white p-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length ? (
        <ul className="overflow-hidden rounded-2xl border border-border bg-white">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification._id}
              notification={notification}
              deleting={deletingId === notification._id}
              onOpen={() => void handleOpen(notification)}
              onDelete={() => void handleDelete(notification)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState icon={BellOff} title="No notifications yet" />
      )}

      {kyc.fallback}
    </>
  );
}
