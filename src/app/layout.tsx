import "@/styles/globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Allo Inventory",
  description: "Inventory reservation and fulfillment platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
