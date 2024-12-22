"use client";

import React, { useState } from "react";
import { HiPaperAirplane } from "react-icons/hi2";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const PromptInput = ({
  placeholder,
  loading,
  setLoading,
}: {
  placeholder?: string;
  loading: boolean;
  setLoading: any;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const router = useRouter();

  const handleSubmit = () => {
    setLoading(true);
    router.push(`/?query=${inputValue}`);
    setInputValue("");
  };

  return (
    <div className="relative w-full">
      <Input
        placeholder={
          placeholder ? placeholder : "Search for something online..."
        }
        className="rounded-full bg-[#fffdf5] pr-16"
        value={inputValue}
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
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin" size={32} />
        ) : (
          <HiPaperAirplane />
        )}
      </button>
    </div>
  );
};

export default PromptInput;
