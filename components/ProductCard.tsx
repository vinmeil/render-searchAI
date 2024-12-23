import React from "react";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";

const ProductCard = ({ product }: { product: Product }) => {
  const imageUrl = product.img_link!.startsWith("https:")
    ? product.img_link!
    : `https:${product.img_link!}`;

  return (
    <Link
      href={product.product_link!}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full md:h-[300px] rounded-xl flex flex-col border-b-2 border-border"
    >
      <div className="relative w-full h-0 pb-[100%]">
        <Image
          src={imageUrl}
          alt={product.name!}
          layout="fill"
          objectFit="cover"
          className="rounded-xl"
        />
      </div>
      <div className="flex flex-col p-2 text-sm">
        <h3 className="text-foreground line-clamp-2">{product.name}</h3>
        <p className="text-muted-foreground pb-2">{product.price}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
