import type { Metadata } from "next";
import { ConversationList } from "@/components/messages/conversation-list";

export const metadata: Metadata = {
  title: "Messages",
};

/**
 * Two-pane on `md+`: a fixed 360px conversation list beside the thread.
 *
 * Under `md` the layout is a pass-through - the index page renders the list
 * and the thread page takes the whole viewport - which is what makes the
 * mobile "list screen / chat screen" split work without a second route tree.
 */
export default function MessagesLayout({ children }: LayoutProps<"/dashboard/messages">) {
  return (
    <div className="md:container-app md:py-6">
      <div className="md:grid md:h-[calc(100dvh-7rem)] md:grid-cols-[360px_minmax(0,1fr)] md:gap-4">
        <aside
          aria-label="Conversations"
          className="hidden min-h-0 overflow-y-auto rounded-2xl border border-border bg-white p-3 md:block"
        >
          <ConversationList />
        </aside>

        <div className="min-w-0 md:min-h-0">{children}</div>
      </div>
    </div>
  );
}
