"use client";

import ProductCard from "@/components/ProductCard";
import PromptInput from "@/components/PromptInput";
import { placeholderRecommendations } from "@/constants";
import { Product } from "@/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProducts } from "@/backend/app.js";

export default function Home() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string | null>(searchParams.get("query"));
  let results = [] as Product[];

  useEffect(() => {
    const newQuery = searchParams.get("query");
    setQuery(newQuery);

    const fetchProducts = async () => {
      if (newQuery) {
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
          results = data;
          console.log("Results", results);
        } catch (err) {
          console.error(err.message);
        }
      }
    };

    fetchProducts();
  }, [searchParams]);

  return (
    <>
      {results.length > 0 ? (
        <div>hi</div>
      ) : (
        <div className="flex items-center justify-center h-screen md:w-screen">
          <div className="md:w-1/2 flex flex-col gap-2 items-center">
            <h1 className="text-3xl font-playfair">Looking for something?</h1>
            <p className="text-muted-foreground mb-5">
              Search and discover everything.
            </p>
            <PromptInput />
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
