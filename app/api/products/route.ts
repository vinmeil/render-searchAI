import { NextRequest, NextResponse } from "next/server";
import { scrapeAllProducts, keywordExtractor2 } from "../../../app.js"; // Adjust the import path as needed

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  console.log(`Query received: ${query}`);

  const keywords = await keywordExtractor2(query);
  // keywords = query;
  console.log(`Extracted keywords: ${keywords}`);

  try {
    const products = await scrapeAllProducts(keywords);
    console.log(`Rendering products for keywords: ${keywords}`);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
