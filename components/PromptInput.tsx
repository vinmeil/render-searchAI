"use client";

import React, { useState } from "react";
import { HiPaperAirplane } from "react-icons/hi2";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";

const PromptInput = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const router = useRouter();

  const handleSubmit = () => {
    router.push(`/?query=${inputValue}`);
  };

  return (
    <div className="relative w-full">
      <Input
        placeholder="Search for something online..."
        className="rounded-full bg-white bg-opacity-40 pr-16"
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          e.key === "Enter" && handleSubmit();
        }}
      />
      <button
        disabled={!inputValue}
        type="submit"
        className={`${
          !inputValue && "bg-muted-foreground"
        } absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-3 text-xl rounded-full`}
        onClick={handleSubmit}
      >
        <HiPaperAirplane />
      </button>
    </div>
  );
};

export default PromptInput;
