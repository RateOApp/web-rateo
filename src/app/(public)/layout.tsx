import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { MobilePublicTabs } from "@/components/layout/mobile-public-tabs";
import { getServerSession } from "@/lib/session";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <>
      <PublicHeader session={session} />
      {/* pb-20 clears the fixed mobile tab bar (h-16 + breathing room). */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <PublicFooter />
      <MobilePublicTabs isLoggedIn={session !== null} />
    </>
  );
}
