import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { ConversationList } from "@/components/messages/conversation-list";
import { isObjectId } from "@/lib/format";

/**
 * The messages index.
 *
 * `?user=<id>` is the legacy deep link every "Send a message" button used
 * before the thread got its own route; it is normalised here so old links (and
 * anything still pointing at the query form) land on `/dashboard/messages/<id>`.
 */
export default async function MessagesPage({
  searchParams,
}: PageProps<"/dashboard/messages">) {
  const { user } = await searchParams;
  const target = Array.isArray(user) ? user[0] : user;
  if (target && isObjectId(target)) redirect(`/dashboard/messages/${target}`);

  return (
    <>
      {/* Mobile: the index IS the list. */}
      <div className="container-app py-4 md:hidden">
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-brand-900">Messages</h1>
        <ConversationList />
      </div>

      {/* Desktop: the list lives in the layout's left pane. */}
      <div className="hidden h-full flex-col items-center justify-center rounded-2xl border border-border bg-white p-8 text-center md:flex">
        <span
          aria-hidden="true"
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"
        >
          <MessagesSquare className="size-6" />
        </span>
        <p className="text-base font-semibold text-brand-900">Select a conversation</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Pick someone from the list to read and reply to your messages.
        </p>
      </div>
    </>
  );
}
