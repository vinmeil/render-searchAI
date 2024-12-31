import { NextRequest, NextResponse } from "next/server";
import { scrapeAllProducts, keywordExtractor2 } from "../../../app.js"; // Adjust the path if needed

// Maximum duration for route execution (in seconds)
export const maxDuration = 60;

// POST request handler
export async function POST(req: NextRequest) {
  try {
    // Parse the query from the request body
    const { query } = await req.json();
    console.log(`Query received: ${query}`);

    // Extract keywords using the Gemini AI extractor
    const keywords = await keywordExtractor2(query);
    console.log(`Extracted keywords: ${keywords}`);

    // Fetch products based on extracted keywords
    const products = await scrapeAllProducts(keywords);
    console.log(`Rendering products for keywords: ${keywords}`);

    // Return the products in the response
    return NextResponse.json(products);

  } catch (error) {
    // Enhanced error logging and type handling
    if (error instanceof Error) {
      // Log the error message if it's an instance of Error
      console.error("Error fetching products:", error.message);

      // Return a structured error response
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    } else {
      // Handle unknown errors
      console.error("Unexpected error:", error);

      // Return a generic error response
      return NextResponse.json(
        { error: "Internal Server Error", details: "Unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

// GET request handler for testing API availability
export async function GET(req: NextRequest) {
  try {
    console.log("GET request received");

    // Simple success response for debugging
    return NextResponse.json({ message: "GET request is working!" });

  } catch (error) {
    // Handle errors in the GET request
    if (error instanceof Error) {
      console.error("Error handling GET request:", error.message);
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    } else {
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "Internal Server Error", details: "Unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
