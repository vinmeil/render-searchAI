import React from "react";
import { FaUser } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Product, ChatResponse } from "@/types";
import ProductCard from "./ProductCard";

const Chat = ({
  userChats,
  responses,
  loading,
}: {
  userChats: string[];
  responses: Product[][];
  loading: boolean;
}) => {
  console.log("Responses from scraping:", responses);
  console.log(
    "Testing the flattening:",
    Object.values(responses[0])?.flatMap((array) => array)
  );

  return (
    <div className="md:pb-[120px] flex flex-col items-center gap-6">
      {userChats.map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          {userChats[index] && responses[index] && (
            <>
              <div className="flex gap-2 items-center mt-6">
                <div className="border border-border rounded-lg p-2 shadow-lg">
                  <FaUser className="text-foreground" />
                </div>
                <p className="italic">"{userChats[index]}"</p>
              </div>
              {responses[index] && (
                <div className="grid gap-2 grid-cols-4">
                  {Object.values(responses[index])
                    ?.flatMap((array) => array)
                    .slice(0, 24)
                    .map((product, index) => (
                      <div key={index}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {loading && (
        <AiOutlineLoading3Quarters className="animate-spin" size={32} />
      )}
    </div>
  );
};

export default Chat;
