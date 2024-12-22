import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/backend/app";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  console.log("Query inside POST", query);
  const products = await getProducts(query as string);
  return NextResponse.json(products);
}
