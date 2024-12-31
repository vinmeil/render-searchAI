import express, { Request, Response } from "express";
const router = express.Router();

// Import the scrapeAllProducts function
const { scrapeAllProducts } = require("../../../app.js");

// Route to fetch products
router.get(
  "/products",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const keywords = req.query.keywords as string;

      if (!keywords) {
        res.status(400).json({ error: "Missing keywords" });
        return;
      }

      const products = await scrapeAllProducts(keywords);
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error.message || error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
