"use client";

import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import { createUser } from "@/lib/actions/user.actions";

const Navbar = () => {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <div className="w-full flex justify-between items-center px-5 bg-background border-b border-border py-4">
      <div onClick={handleLogoClick} className="font-playfair cursor-pointer">
        searchAI (placeholder)
      </div>
      <div className="flex justify-between items-center gap-12">
        {/* TODO: Log in and pricing page */}
        <Link href="/pricing" className="relative group">
          <span className="hover:text-primary transition-all duration-300">
            Pricing
          </span>
          <span className="absolute left-0 bottom-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        </Link>

        <SignedOut>
          <Button className="bg-primary-2">
            <Link href="/sign-in">Login</Link>
          </Button>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  );
};

export default Navbar;
