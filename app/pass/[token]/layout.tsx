import type { Metadata } from "next";

// Personal page behind a secret link — never index it, never send it as a Referer.
export const metadata: Metadata = {
  title: "Studio-Pass",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PassLayout({ children }: { children: React.ReactNode }) {
  return children;
}
