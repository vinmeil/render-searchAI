import Navbar from "@/components/Navbar";
import React, { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`relative`}>
      <div className="fixed top-0 w-full z-10">
        <Navbar />
      </div>
      <Suspense fallback={null}>
        <div className="md:mt-20 z-1">{children}</div>
      </Suspense>
    </div>
  );
}
