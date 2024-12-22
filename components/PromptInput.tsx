import React from "react";
import { HiPaperAirplane } from "react-icons/hi2";
import { Input } from "./ui/input";

const PromptInput = () => {
  return (
    <div className="relative w-full">
      <Input
        placeholder="Search for something online..."
        className="rounded-full bg-white bg-opacity-40 pr-16"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-3 text-xl rounded-full"
      >
        <HiPaperAirplane />
      </button>
    </div>
  );
};

export default PromptInput;
