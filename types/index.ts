export type Product = {
  name?: string;
  price?: string;
  img_link?: string;
  product_link?: string;
};

export type ChatResponse = {
  products?: Product[];
};

// user params
export type CreateUserParams = {
  clerkId: string;
  email: string;
  username: string;
  tier: number;
  premiumStartDate?: Date;
  premiumEndDate?: Date;
  photo: string;
};

export type UpdateUserParams = {
  username: string;
  photo: string;
};
