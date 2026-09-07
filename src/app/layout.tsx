import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/providers/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Rate'O — Jobs, companies and honest ratings",
    template: "%s | Rate'O",
  },
  description:
    "Find jobs, discover companies and see how employers and employees really rate each other. Rate'O brings honest workplace ratings to Nigeria's job market.",
  applicationName: "Rate'O",
  openGraph: {
    type: "website",
    siteName: "Rate'O",
    title: "Rate'O — Jobs, companies and honest ratings",
    description:
      "Find jobs, discover companies and see how employers and employees really rate each other.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rate'O — Jobs, companies and honest ratings",
    description:
      "Find jobs, discover companies and see how employers and employees really rate each other.",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#113D3C", // brand-900, mirrors globals.css
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
