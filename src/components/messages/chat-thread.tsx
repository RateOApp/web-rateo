"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { useSocketConnection, useSocketEvent } from "@/components/dashboard/socket-provider";
import { ChatHeader } from "@/components/messages/chat-header";
import { ChatProfileSheet } from "@/components/messages/chat-profile-sheet";
import { Composer } from "@/components/messages/composer";
import { DateDivider, dayKey, dayLabel } from "@/components/messages/date-divider";
import { MessageBubble } from "@/components/messages/message-bubble";
import { ReportMessageDialog } from "@/components/messages/report-message-dialog";
import { TypingIndicator } from "@/components/messages/typing-indicator";
import type { ComposerBanner } from "@/components/messages/reply-banner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONVERSATIONS_KEY,
  UNREAD_MESSAGES_KEY,
  useChatProfile,
  useConversations,
  useThread,
} from "@/hooks/use-messages";
import { useMe } from "@/hooks/use-me";
import { getApiErrorMessage } from "@/lib/api/client";
import { joinRoom, leaveRoom } from "@/lib/socket";
import { messagesService } from "@/services/messages";
import {
  blockedIds,
  messageUserName,
  pairRoom,
  refId,
  type Message,
  type MessageUser,
  type SendMessagePayload,
  type ThreadMessage,
} from "@/types/messages";

/** How long after the last keystroke `stop_typing` fires (and the resend window). */
const TYPING_WINDOW_MS = 2000;

/**
 * Merges a server document onto a row already on screen.
 *
 * The `edit` and `react` socket emissions currently skip `populate`, so their
 * `sender` / `replyTo` arrive as bare ObjectId strings. Overwriting the
 * populated versions would blank out the reply quote, so a string only wins
 * when there is nothing populated to keep.
 */
function mergeUpdate(existing: ThreadMessage, updated: Message): ThreadMessage {
  const keepPopulated = <T,>(next: T | undefined, prev: T | undefined): T | undefined => {
    if (next === undefined || next === null) return prev;
    if (typeof next === "string" && prev && typeof prev === "object") return prev;
    return next;
  };

  return {
    ...existing,
    ...updated,
    sender: keepPopulated(updated.sender, existing.sender),
    receiver: keepPopulated(updated.receiver, existing.receiver),
    replyTo: keepPopulated(updated.replyTo ?? undefined, existing.replyTo ?? undefined) ?? null,
    localStatus: undefined,
    localPayload: undefined,
  };
}

/** Appends an incoming message, replacing my matching optimistic bubble. */
function mergeIncoming(
  prev: ThreadMessage[],
  incoming: Message,
  myId: string | null,
): ThreadMessage[] {
  if (prev.some((row) => row._id === incoming._id)) return prev;

  if (myId && refId(incoming.sender) === myId) {
    const index = prev.findIndex(
      (row) =>
        row.localStatus === "sending" &&
        (row.content ?? "") === (incoming.content ?? "") &&
        (row.attachments?.length ?? 0) === (incoming.attachments?.length ?? 0),
    );
    if (index !== -1) {
      const next = [...prev];
      next[index] = incoming;
      return next;
    }
  }

  return [...prev, incoming];
}

/** `/dashboard/messages/[userId]` - one conversation. */
export function ChatThread({ userId }: { userId: string }) {
  const { data: me } = useMe();
  const myId = me?._id ?? null;

  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const { socket, connected } = useSocketConnection();

  const thread = useThread(userId);
  const conversations = useConversations();
  const otherProfile = useChatProfile(userId);
  const myProfile = useChatProfile(myId);

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
  const [editing, setEditing] = useState<ThreadMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [theyAreTyping, setTheyAreTyping] = useState(false);
  const [blockedByThem, setBlockedByThem] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  /** `false` until the thread has been scrolled to the bottom at least once. */
  const parkedAtBottom = useRef(false);
  const typingSentAt = useRef(0);
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Files behind failed sends, so Retry can re-upload rather than drop them. */
  const failedFiles = useRef(new Map<string, File>());
  /** Object URLs handed to optimistic bubbles; revoked when the thread unmounts. */
  const objectUrls = useRef<string[]>([]);

  /* ---- who am I talking to ------------------------------------------- */

  const listedUser = conversations.data?.find((row) => row.user._id === userId)?.user ?? null;
  const profile = otherProfile.data ?? null;
  const otherUser: MessageUser | null = profile
    ? {
        _id: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        companyName: profile.companyName,
        role: profile.role,
      }
    : listedUser;
  const otherName = otherUser ? messageUserName(otherUser) : "Chat";
  const blockedByMe = blockedIds(myProfile.data).includes(userId);
  const blocked = blockedByMe || blockedByThem;

  /* ---- server state -> working copy ----------------------------------- */

  // Adjusting state during render (rather than in an effect) is the supported
  // pattern for deriving from a prop/query change: no cascading second render,
  // and the thread paints the fresh data in the same commit.
  const [syncedFrom, setSyncedFrom] = useState<Message[] | undefined>(undefined);
  if (thread.data && thread.data !== syncedFrom) {
    setSyncedFrom(thread.data);
    const fetched = thread.data;
    setMessages((prev) => {
      const known = new Set(fetched.map((row) => row._id));
      // Keep unacknowledged optimistic bubbles on top of the refetched thread.
      const pending = prev.filter((row) => row.localStatus && !known.has(row._id));
      return [...fetched, ...pending];
    });
  }

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const toBottom = () => {
      element.scrollTop = element.scrollHeight;
    };
    toBottom();
    // Once more after layout, so a bubble that grew this frame still lands
    // at the bottom.
    const frame = requestAnimationFrame(toBottom);
    return () => cancelAnimationFrame(frame);
  }, [messages.length, theyAreTyping]);

  // Attachments (and web fonts) finish loading after the messages are already
  // on screen and change the thread's height. Until the thread has been
  // parked at the bottom once, every resize re-pins it; after that only a
  // reader who is already at the bottom is followed, so scrolling up to read
  // history is never yanked back down.
  useEffect(() => {
    const element = scroller.current;
    const content = element?.firstElementChild;
    if (!element || !content) return;

    const observer = new ResizeObserver(() => {
      const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
      if (!parkedAtBottom.current || distance < 120) {
        element.scrollTop = element.scrollHeight;
        if (element.scrollHeight > element.clientHeight) parkedAtBottom.current = true;
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [thread.isPending]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.length = 0;
    };
  }, []);

  /* ---- read receipts --------------------------------------------------- */

  const markRead = useCallback(() => {
    void messagesService
      .markRead(userId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: UNREAD_MESSAGES_KEY });
        void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      })
      // 403 for an unverified account is expected here; nothing to surface.
      .catch(() => {});
  }, [userId, queryClient]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  /* ---- rooms ----------------------------------------------------------- */

  const room = myId ? pairRoom(myId, userId) : null;

  useEffect(() => {
    if (!room) return;
    joinRoom(room);
    return () => leaveRoom(room);
    // `connected` re-runs the join after a reconnect (the emit is idempotent).
  }, [room, connected]);

  /* ---- live events ----------------------------------------------------- */

  useSocketEvent("receive_message", (incoming) => {
    const senderId = refId(incoming.sender);
    const receiverId = refId(incoming.receiver);
    if (!senderId || !receiverId) return;

    const belongsHere =
      (senderId === userId && receiverId === myId) ||
      (senderId === myId && receiverId === userId);
    if (!belongsHere) return;

    setMessages((prev) => mergeIncoming(prev, incoming, myId));
    // The thread is open, so anything they send is read the moment it lands.
    if (senderId === userId) markRead();
  });

  useSocketEvent("message_updated", (payload) => {
    if (payload.type === "delete") {
      const deletedId = payload.messageId;
      setMessages((prev) =>
        prev.map((row) =>
          row._id === deletedId
            ? payload.message
              ? mergeUpdate(row, payload.message)
              : { ...row, isDeleted: true, attachments: [], reactions: [] }
            : row,
        ),
      );
      return;
    }

    const updated = payload.message;
    if (!updated?._id) return;
    setMessages((prev) =>
      prev.map((row) => (row._id === updated._id ? mergeUpdate(row, updated) : row)),
    );
  });

  useSocketEvent("messages_read", (payload) => {
    if (String(payload.reader) !== userId) return;
    setMessages((prev) =>
      prev.map((row) => (refId(row.sender) === myId && !row.read ? { ...row, read: true } : row)),
    );
  });

  useSocketEvent("typing", (payload) => {
    if (String(payload.senderId) === userId) setTheyAreTyping(true);
  });

  useSocketEvent("stop_typing", (payload) => {
    if (String(payload.senderId) === userId) setTheyAreTyping(false);
  });

  /* ---- typing (outgoing) ----------------------------------------------- */

  const emitStopTyping = useCallback(() => {
    if (stopTypingTimer.current) {
      clearTimeout(stopTypingTimer.current);
      stopTypingTimer.current = null;
    }
    if (typingSentAt.current === 0) return;
    typingSentAt.current = 0;
    if (socket && room && myId) socket.emit("stop_typing", { room, senderId: myId });
  }, [socket, room, myId]);

  const handleTyping = useCallback(() => {
    if (!socket || !room || !myId) return;
    const now = Date.now();
    if (now - typingSentAt.current > TYPING_WINDOW_MS) {
      typingSentAt.current = now;
      socket.emit("typing", { room, senderId: myId });
    }
    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(emitStopTyping, TYPING_WINDOW_MS);
  }, [socket, room, myId, emitStopTyping]);

  useEffect(
    () => () => {
      if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    },
    [],
  );

  /* ---- actions ---------------------------------------------------------- */

  const refreshConversations = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
  }, [queryClient]);

  const settle = useCallback((tempId: string, saved: Message) => {
    setMessages((prev) =>
      // The socket echo may have replaced the optimistic bubble already.
      prev.some((row) => row._id === saved._id)
        ? prev.filter((row) => row._id !== tempId)
        : prev.map((row) => (row._id === tempId ? saved : row)),
    );
  }, []);

  const failSend = useCallback((tempId: string, payload: SendMessagePayload, error: unknown) => {
    setMessages((prev) =>
      prev.map((row) =>
        row._id === tempId ? { ...row, localStatus: "failed", localPayload: payload } : row,
      ),
    );
    const message = getApiErrorMessage(error, "Failed to send message");
    if (/blocked by this user/i.test(message)) setBlockedByThem(true);
    toast.error(message);
  }, []);

  async function handleSubmit() {
    if (sending) return;
    if (!kyc.requireVerified()) return;

    if (editing) {
      const target = editing;
      const content = text.trim();
      if (!content) return;
      setText("");
      setEditing(null);
      setSending(true);
      try {
        const updated = await messagesService.edit(target._id, content);
        setMessages((prev) =>
          prev.map((row) => (row._id === target._id ? mergeUpdate(row, updated) : row)),
        );
        refreshConversations();
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to edit message"));
        setText(content);
        setEditing(target);
      } finally {
        setSending(false);
      }
      return;
    }

    const content = text.trim();
    const attachment = file;
    if (!content && !attachment) return;

    const quoted = replyTo;
    setText("");
    setFile(null);
    setReplyTo(null);
    emitStopTyping();

    const tempId = `temp-${Date.now()}`;
    let previewUrl: string | null = null;
    if (attachment) {
      previewUrl = URL.createObjectURL(attachment);
      objectUrls.current.push(previewUrl);
    }

    const optimistic: ThreadMessage = {
      _id: tempId,
      sender: myId ?? undefined,
      receiver: userId,
      content,
      attachments: previewUrl ? [previewUrl] : [],
      createdAt: new Date().toISOString(),
      replyTo: quoted
        ? { _id: quoted._id, content: quoted.content, sender: quoted.sender }
        : null,
      localStatus: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    const payload: SendMessagePayload = {
      receiverId: userId,
      content,
      replyTo: quoted?._id ?? null,
      attachments: [],
    };

    try {
      if (attachment) {
        const uploaded = await messagesService.uploadImage(attachment);
        if (uploaded.url) payload.attachments = [uploaded.url];
      }
      const saved = await messagesService.send(payload);
      settle(tempId, saved);
      refreshConversations();
    } catch (error) {
      if (attachment) failedFiles.current.set(tempId, attachment);
      failSend(tempId, payload, error);
    } finally {
      setSending(false);
    }
  }

  async function handleRetry(message: ThreadMessage) {
    const payload = message.localPayload;
    if (!payload) return;

    setMessages((prev) =>
      prev.map((row) => (row._id === message._id ? { ...row, localStatus: "sending" } : row)),
    );

    try {
      const attachment = failedFiles.current.get(message._id);
      const attachments = [...(payload.attachments ?? [])];
      if (attachment && attachments.length === 0) {
        const uploaded = await messagesService.uploadImage(attachment);
        if (uploaded.url) attachments.push(uploaded.url);
      }
      const saved = await messagesService.send({ ...payload, attachments });
      failedFiles.current.delete(message._id);
      settle(message._id, saved);
      refreshConversations();
    } catch (error) {
      failSend(message._id, payload, error);
    }
  }

  async function handleReact(message: ThreadMessage, emoji: string) {
    try {
      const updated = await messagesService.react(message._id, emoji);
      setMessages((prev) =>
        prev.map((row) => (row._id === message._id ? mergeUpdate(row, updated) : row)),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to react to message"));
    }
  }

  async function handleDelete(message: ThreadMessage) {
    try {
      await messagesService.remove(message._id);
      setMessages((prev) =>
        prev.map((row) =>
          row._id === message._id
            ? { ...row, isDeleted: true, attachments: [], reactions: [] }
            : row,
        ),
      );
      refreshConversations();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete message"));
    }
  }

  function startEdit(message: ThreadMessage) {
    setEditing(message);
    setReplyTo(null);
    setFile(null);
    setText(message.content ?? "");
  }

  function startReply(message: ThreadMessage) {
    setEditing(null);
    setReplyTo(message);
  }

  /* ---- rendering -------------------------------------------------------- */

  const rows = useMemo(() => {
    const output: Array<
      { kind: "divider"; key: string; label: string } | { kind: "message"; key: string; message: ThreadMessage }
    > = [];
    let currentDay = "";
    for (const message of messages) {
      const key = dayKey(message.createdAt);
      if (key !== currentDay) {
        currentDay = key;
        const label = dayLabel(message.createdAt);
        if (label) output.push({ kind: "divider", key: `day-${key}`, label });
      }
      output.push({ kind: "message", key: message._id, message });
    }
    return output;
  }, [messages]);

  const banner: ComposerBanner | null = editing
    ? { kind: "edit" }
    : replyTo
      ? {
          kind: "reply",
          name: refId(replyTo.sender) === myId ? "Yourself" : otherName,
          preview: replyTo.content?.trim() || (replyTo.attachments?.length ? "Photo" : ""),
        }
      : null;

  return (
    <section
      aria-label={`Conversation with ${otherName}`}
      className="-mb-20 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-cream-50 md:mb-0 md:h-full md:rounded-2xl md:border md:border-border"
    >
      <ChatHeader
        user={otherUser}
        name={otherName}
        subtitle={theyAreTyping ? "Typing..." : undefined}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {thread.isPending ? (
          <ul className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((row) => (
              <li key={row} className={row % 2 === 0 ? "flex" : "flex justify-end"}>
                <Skeleton className="h-11 w-48 rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : (
          <ul aria-live="polite" aria-label="Messages" className="flex flex-col gap-2">
            {rows.map((row) =>
              row.kind === "divider" ? (
                <DateDivider key={row.key} label={row.label} />
              ) : (
                <MessageBubble
                  key={row.key}
                  message={row.message}
                  mine={refId(row.message.sender) === myId}
                  myId={myId}
                  otherName={otherName}
                  onReact={(message, emoji) => void handleReact(message, emoji)}
                  onReply={startReply}
                  onEdit={startEdit}
                  onDelete={(message) => void handleDelete(message)}
                  onReport={(message) => setReportTarget(message._id)}
                  onRetry={(message) => void handleRetry(message)}
                />
              ),
            )}
            {theyAreTyping ? <TypingIndicator name={otherName} /> : null}
          </ul>
        )}
      </div>

      {blocked ? (
        <p className="shrink-0 border-t border-border bg-white px-4 py-4 text-center text-sm text-muted-foreground">
          {blockedByMe
            ? "You have blocked this user. Unblock to send messages."
            : "You have been blocked by this user."}
        </p>
      ) : (
        <Composer
          value={text}
          onValueChange={setText}
          onSubmit={() => void handleSubmit()}
          onTyping={handleTyping}
          banner={banner}
          onCancelBanner={() => {
            setReplyTo(null);
            if (editing) setText("");
            setEditing(null);
          }}
          file={file}
          onFileChange={setFile}
          sending={sending}
        />
      )}

      <ChatProfileSheet
        userId={userId}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        blocked={blockedByMe}
      />

      <ReportMessageDialog
        messageId={reportTarget}
        open={reportTarget !== null}
        onOpenChange={(next) => {
          if (!next) setReportTarget(null);
        }}
      />

      {kyc.fallback}
    </section>
  );
}
