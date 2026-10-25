import "./globals.css";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hybrid prototype",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="banner">
          <strong>Throwaway hybrid prototype.</strong> Sample companies only. Not the live portal.
        </div>
        <main>{children}</main>
      </body>
    </html>
  );
}
