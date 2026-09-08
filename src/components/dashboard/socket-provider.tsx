"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AccountSuspendedDialog } from "@/components/messages/account-suspended-dialog";
import { useMe } from "@/hooks/use-me";
import { NOTIFICATIONS_KEY } from "@/hooks/use-notifications";
import { CONVERSATIONS_KEY, UNREAD_MESSAGES_KEY } from "@/hooks/use-messages";
import { connectSocket, disconnectSocket, type AppSocket } from "@/lib/socket";
import { authService } from "@/services/auth";
import { messageUserName, refId, refUser } from "@/types/messages";
import type { ServerToClientEvents } from "@/types/socket";

type SocketContextValue = {
  socket: AppSocket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

/** The live socket, or `null` while it connects (or when it never will). */
export function useSocket(): AppSocket | null {
  return useContext(SocketContext).socket;
}

/** Socket plus its connection state, for effects that must re-join on connect. */
export function useSocketConnection(): SocketContextValue {
  return useContext(SocketContext);
}

/**
 * Subscribes to one server event for the lifetime of the calling component.
 *
 * The handler is held in a ref, so a fresh closure on every render never
 * re-subscribes - the listener is added once per socket and removed on
 * unmount. Handlers therefore always see current props without the caller
 * having to memoise anything.
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
): void {
  const socket = useSocket();
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return;

    const listener = (...args: unknown[]) => {
      (ref.current as (...handlerArgs: unknown[]) => void)(...args);
    };

    // socket.io types `on`/`off` with a conditional that TypeScript cannot
    // resolve for a still-generic `E`; the payload types are enforced on the
    // handler side by `ServerToClientEvents[E]`, which is what callers see.
    const emitter = socket as unknown as {
      on(name: string, handler: (...args: unknown[]) => void): void;
      off(name: string, handler: (...args: unknown[]) => void): void;
    };

    emitter.on(event, listener);
    return () => {
      emitter.off(event, listener);
    };
  }, [socket, event]);
}

/**
 * Owns the app-wide connection and the listeners that are not tied to any one
 * screen. Mounted by `DashboardProviders`, so it exists on every authenticated
 * page and nowhere else.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useMe();
  const userId = user?._id ?? null;

  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // The thread currently on screen, read inside listeners without making them
  // depend on the pathname (which would re-subscribe on every navigation).
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    void connectSocket(userId).then((instance) => {
      if (cancelled || !instance) return;
      setSocket(instance);
      setConnected(instance.connected);
      instance.on("connect", () => setConnected(true));
      instance.on("disconnect", () => setConnected(false));
    });

    return () => {
      cancelled = true;
      setSocket(null);
      setConnected(false);
      disconnectSocket();
    };
  }, [userId]);

  const value = useMemo<SocketContextValue>(() => ({ socket, connected }), [socket, connected]);

  const handleLogout = useCallback(() => {
    if (loggingOut) return;
    setLoggingOut(true);
    void authService.logout().finally(() => {
      disconnectSocket();
      // A hard navigation is deliberate: the session is gone, and a full
      // document load is the only way to drop every cached RSC payload and
      // in-memory query result belonging to the suspended account.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    });
  }, [loggingOut]);

  return (
    <SocketContext.Provider value={value}>
      <GlobalSocketListeners
        userId={userId}
        pathnameRef={pathnameRef}
        onSuspended={() => setSuspended(true)}
        invalidate={(key) => void queryClient.invalidateQueries({ queryKey: key })}
        refresh={() => router.refresh()}
      />
      {children}
      <AccountSuspendedDialog open={suspended} busy={loggingOut} onLogout={handleLogout} />
    </SocketContext.Provider>
  );
}

/**
 * Split out so the listeners can use `useSocketEvent` (which reads the context
 * the provider above supplies) instead of re-implementing subscription here.
 */
function GlobalSocketListeners({
  userId,
  pathnameRef,
  onSuspended,
  invalidate,
  refresh,
}: {
  userId: string | null;
  pathnameRef: React.RefObject<string>;
  onSuspended: () => void;
  invalidate: (key: readonly unknown[]) => void;
  refresh: () => void;
}) {
  useSocketEvent("notification", () => {
    invalidate(NOTIFICATIONS_KEY);
  });

  useSocketEvent("new_message_notification", (message) => {
    invalidate(CONVERSATIONS_KEY);
    invalidate(UNREAD_MESSAGES_KEY);

    const senderId = refId(message.sender);
    // My own outgoing message echoes here too - only the incoming one is news.
    if (!senderId || senderId === userId) return;

    invalidate(["messages", senderId]);

    // Silent while the user is already reading that exact thread.
    if (pathnameRef.current === `/dashboard/messages/${senderId}`) return;

    const name = messageUserName(refUser(message.sender));
    toast.message(`New message from ${name}`, {
      description: message.content?.trim() || (message.attachments?.length ? "Photo" : undefined),
    });
  });

  useSocketEvent("kyc_updated", (payload) => {
    invalidate(["me"]);
    refresh();
    const approved = payload.kyc?.status === "approved";
    const description = payload.message?.trim();
    if (approved) {
      toast.success("Verified 🎉", { description });
    } else {
      toast.message("Verification update", { description });
    }
  });

  useSocketEvent("account_status_changed", (payload) => {
    if (payload.isActive !== false) return;
    if (userId && String(payload.userId) !== userId) return;
    onSuspended();
  });

  useSocketEvent("user_blocked", (payload) => {
    const by = typeof payload.blockedBy === "string" ? payload.blockedBy : payload.blockedBy?._id;
    const target =
      typeof payload.blockedUser === "string" ? payload.blockedUser : payload.blockedUser?._id;
    const other = by === userId ? target : by;
    invalidate(["chatProfile"]);
    if (other) invalidate(["messages", other]);
  });

  useSocketEvent("user_unblocked", (payload) => {
    const by =
      typeof payload.unblockedBy === "string" ? payload.unblockedBy : payload.unblockedBy?._id;
    const target =
      typeof payload.unblockedUser === "string"
        ? payload.unblockedUser
        : payload.unblockedUser?._id;
    const other = by === userId ? target : by;
    invalidate(["chatProfile"]);
    if (other) invalidate(["messages", other]);
  });

  useSocketEvent("room_denied", (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[socket] room denied: ${payload.room}`, payload.reason ?? "");
    }
  });

  return null;
}
