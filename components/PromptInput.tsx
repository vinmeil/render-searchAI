"use client";

import React, { useState, useEffect } from "react";
import { HiPaperAirplane } from "react-icons/hi2";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const PromptInput = ({
  placeholder,
  loading,
  setLoading,
  query,
  setQuery,
}: {
  placeholder?: string;
  loading: boolean;
  setLoading: any;
  query: string;
  setQuery: any;
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setQuery(inputValue);
  };

  useEffect(() => {
    if (query) {
      console.log("Query and Input Value:", query, inputValue);
      router.push(`/?query=${query}`, { scroll: false });
      setInputValue("");
    }
  }, [query, router]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Input
        placeholder={
          placeholder ? placeholder : "Search for something online..."
        }
        className="rounded-full bg-[#fbfbfb] pr-16"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button
        disabled={!inputValue}
        type="submit"
        className={`${
          !inputValue && "bg-muted-foreground"
        } absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-3 text-xl rounded-full`}
      >
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin" size={32} />
        ) : (
          <HiPaperAirplane />
        )}
      </button>
    </form>
  );
};

export default PromptInput;
