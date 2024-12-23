import Navbar from "@/components/Navbar";
import React, { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={`relative`}>
        <div className="fixed top-0 w-full z-10">
          <Navbar />
        </div>
        <div className="md:mt-20 z-1">{children}</div>
      </div>
    </Suspense>
  );
}
