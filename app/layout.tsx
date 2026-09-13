import type { Metadata } from "next";
import CustomerShell from "@/customer/components/shell";
import { CustomerProvider } from "@/customer/components/provider";
import WorkspaceProvider from "@/customer/components/workspace-provider";
import { MotionProvider } from "@/customer/components/motion-provider";
import "./globals.css";
import "@/customer/styles/customer.css";

export const metadata: Metadata = {
  title: "Serenity Booking | A little time for you",
  description:
    "Explore salons, discover treatments, and book your next moment of care.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>
          <CustomerProvider>
            <CustomerShell><MotionProvider>{children}</MotionProvider></CustomerShell>
          </CustomerProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
