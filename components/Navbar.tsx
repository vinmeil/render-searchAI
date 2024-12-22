"use client";

import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <div
      onClick={handleLogoClick}
      className="w-full flex justify-between items-center px-5 bg-background border-b border-border py-4"
    >
      <div className="font-playfair cursor-pointer">searchAI (placeholder)</div>
      <div className="flex justify-between items-center gap-6">
        {/* TODO: Log in and pricing page */}
        <Link href="/pricing">Pricing</Link>
        <Button>Log In</Button>
      </div>
    </div>
  );
};

export default Navbar;
