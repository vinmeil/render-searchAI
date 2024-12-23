export type Product = {
  name?: string;
  price?: string;
  img_link?: string;
  product_link?: string;
};

export type ChatResponse = {
  products?: Product[];
};