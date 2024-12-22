"use client";

import ProductCard from "@/components/ProductCard";
import PromptInput from "@/components/PromptInput";
import Chat from "@/components/Chat";

import { placeholderRecommendations } from "@/constants";
import { Product, ChatResponse } from "@/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProducts } from "@/backend/app.js";

export default function Home() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [userChats, setUserChats] = useState<string[]>([
    // "blue shirt",
    // "shirt",
    // "green shirt",
  ]);
  const [responses, setResponses] = useState<Product[][]>([
    // placeholderRecommendations,
    // placeholderRecommendations,
    // placeholderRecommendations,
  ]);

  useEffect(() => {
    const newQuery = searchParams.get("query");

    // go back to landing page
    if (!newQuery) {
      setLoading(false);
      setResults([]);
      setResponses([]);
      setUserChats([]);
      return;
    }

    const fetchProducts = async () => {
      if (newQuery) {
        setUserChats([...userChats, newQuery]);
        try {
          console.log("Query inside fetchProducts", newQuery);
          const res = await fetch("/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: newQuery }),
          });

          if (!res.ok) {
            throw new Error(`Error: ${res.status} ${res.statusText}`);
          }

          const data = await res.json();
          setResults([...results, data]);
          setResponses([...responses, data]);
          setLoading(false);
          console.log("Data inside function:", data);
        } catch (err: any) {
          console.error(err.message);
        }
      }
    };

    fetchProducts();
    console.log("Results", results);
  }, [searchParams]);

  return (
    <>
      {results.length > 0 ? (
        <div className="flex flex-col justify-center items-center w-screen relative">
          <div className="md:w-[60%] h-screen">
            <Chat
              userChats={userChats}
              responses={responses}
              loading={loading}
            />
          </div>
          <div className="fixed bottom-5 md:w-[50%]">
            <PromptInput
              placeholder="Search for something else..."
              loading={loading}
              setLoading={setLoading}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen md:w-screen">
          <div className="md:w-1/2 flex flex-col gap-2 items-center">
            <h1 className="text-3xl font-playfair">Looking for something?</h1>
            <p className="text-muted-foreground mb-5">
              Search and discover everything.
            </p>
            <PromptInput loading={loading} setLoading={setLoading} />
            <div className="md:w-screen flex flex-col items-center mt-6">
              <h1 className="w-[60%] mb-3 font-playfair">AI Recommendations</h1>
              <div className="flex flex-row gap-2 justify-center items-center w-[60%]">
                {placeholderRecommendations.map((product, index) => (
                  <div key={index} className="text-muted-foreground md:w-[25%]">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
