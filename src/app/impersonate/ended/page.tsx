export const metadata = { title: 'Support session ended' };

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 p-4">
      <div className="max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Support session ended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Support session ended. You can close this tab.
        </p>
      </div>
    </main>
  );
}
