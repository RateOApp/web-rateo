"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessagesSquare, Search } from "lucide-react";
import { ConversationRow } from "@/components/messages/conversation-row";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/hooks/use-messages";
import { conversationName } from "@/types/messages";

/**
 * The conversation list. It is mounted twice on `md+` - once as the layout's
 * left pane and once (hidden) on the index page - but both instances read the
 * same `['conversations']` query, so there is only ever one request.
 *
 * Opening a thread is KYC-gated: `POST /messages` is behind
 * `requireKycVerified` server-side, so an unverified user would land in a
 * thread they cannot reply in.
 */
export function ConversationList({ className }: { className?: string }) {
  const { data, isPending } = useConversations();
  const kyc = useKycGate();
  const params = useParams<{ userId?: string }>();
  const activeId = typeof params?.userId === "string" ? params.userId : undefined;

  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const conversations = data ?? [];
  const filtered = term
    ? conversations.filter((conversation) =>
        conversationName(conversation).toLowerCase().includes(term),
      )
    : conversations;

  return (
    <div className={className}>
      <div className="relative mb-3">
        <label htmlFor="conversation-search" className="sr-only">
          Search for companies
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="conversation-search"
          type="search"
          value={query}
          placeholder="Search for companies"
          className="h-11 rounded-xl bg-white pl-10"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {isPending ? (
        <ul className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((row) => (
            <li key={row} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-48" />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length ? (
        <ul aria-label="Conversations" className="flex flex-col gap-0.5">
          {filtered.map((conversation) => (
            <ConversationRow
              key={conversation.user._id}
              conversation={conversation}
              active={conversation.user._id === activeId}
              onOpen={() => kyc.requireVerified()}
            />
          ))}
        </ul>
      ) : term ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`No conversation matches “${query.trim()}”.`}
        />
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="No messages yet"
          description="Start a conversation from a company or talent profile and it will show up here."
        />
      )}

      {kyc.fallback}
    </div>
  );
}
