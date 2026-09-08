import { notFound, redirect } from "next/navigation";
import { ChatThread } from "@/components/messages/chat-thread";
import { getCachedUser } from "@/lib/current-user";
import { isObjectId } from "@/lib/format";

/**
 * Server shell for one thread. It only validates the id and refuses a
 * self-chat; everything else (messages, block state, live events) is client
 * work, because the thread is a socket-driven surface.
 */
export default async function MessageThreadPage({
  params,
}: PageProps<"/dashboard/messages/[userId]">) {
  const { userId } = await params;
  if (!isObjectId(userId)) notFound();

  const me = await getCachedUser();
  if (me?._id === userId) redirect("/dashboard/messages");

  return <ChatThread userId={userId} />;
}
