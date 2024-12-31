import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { exec } from "child_process";
import { performance } from "perf_hooks"; // Import performance module
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

dotenv.config();

// Initialize Express App
const app = express();
const cache = {}; // Cache for storing product results

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), "static"))); // Static files (CSS/JS)
app.use(express.json());
app.set("view engine", "ejs"); // Set EJS as template engine
app.set("views", path.join(path.resolve(), "templates")); // Point views to 'templates'

// ---------- Utility for Timestamps ----------
function logWithTimestamp(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// ---------- Gemini AI Keyword Extractor ----------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function keywordExtractor2(query) {
  const prompt = `
    "Given a user sentence or question, you will extract a searchable product on an e-commerce site. 
    Extract keywords from the user query. 
    Focus on Japanese entertainment such as gatcha games, vtubers, and anime. 
    Recognize common aliases and partial names for VTubers, anime, and gatcha games (e.g. zzz for Zenless Zone Zero, opm for One Punch Man)
    Output only a few words (keywords).":\n"${query}"`;

  try {
    const result = await model.generateContent(prompt);
    const keywords = result.response.text().trim();
    return keywords;
  } catch (error) {
    console.error("Error with Gemini AI:", error.message);
    return null;
  }
}

// exporting the function for testing
export { keywordExtractor2 };

// ---------- Helper Function for Puppeteer Scripts ----------
function runPuppeteerScript(script, keywords) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(`./puppeteer_scripts/${script}`);
    console.log("Script path:", scriptPath);

    exec(
      `node ${scriptPath} "${keywords}"`,
      (error, stdout, stderr) => {
        if (error) {
          logWithTimestamp(`Error running ${script}: ${stderr}`);
          resolve([]); // Return empty array on error
          return;
        }
        try {
          resolve(JSON.parse(stdout)); // Parse JSON output
        } catch (err) {
          logWithTimestamp(`JSONDecodeError: ${err}`);
          logWithTimestamp(`Output was: ${stdout}`);
          resolve([]); // Return empty array if JSON fails
        }
      }
    );
  });
}

// ---------- Scraping Functions ----------
async function scrapeSite(siteName, script, keywords) {
  const start = performance.now(); // Start time
  console.log(`Scraping ${siteName}...`);
  const result = await runPuppeteerScript(script, keywords);
  const end = performance.now(); // End time
  console.log(
    `Finished scraping ${siteName} in ${(end - start).toFixed(2)} ms`
  );
  return result;
}

// Example scraping function (can be extended for more scrapers)
async function scrapeOhgatchaProducts(keywords) {
  return await scrapeSite("Ohgatcha", "scrape_ohgatcha.js", keywords);
}

// ---------- Load Data Files ----------
// Load text files into memory
const gatchaNames = fs
  .readFileSync(
    path.join(path.resolve(), "rag_data/Xgatcha_names.txt"),
    "utf-8"
  )
  .split("\n")
  .map((name) => name.trim());

const vtuberNames = fs
  .readFileSync(
    path.join(path.resolve(), "rag_data/Xvtuber_names.txt"),
    "utf-8"
  )
  .split("\n")
  .map((name) => name.trim());

const animeNames = fs
  .readFileSync(
    path.join(path.resolve(), "rag_data/Xanime_names.txt"),
    "utf-8"
  )
  .split("\n")
  .map((name) => name.trim());

// ---------- Process Keywords ----------
async function scrapeAllProducts(keywords) {
  logWithTimestamp(`Starting scraping for keywords: ${keywords}`);

  // Check cache first
  if (cache[keywords]) {
    logWithTimestamp(`Fetching cached results for: ${keywords}`);
    return cache[keywords];
  }

  // Determine the category based on the keyword
  console.log("Reading txt files...");
  let category;
  const lowerCaseKeywords = keywords.toLowerCase();
  if (gatchaNames.some((name) => lowerCaseKeywords.includes(name.toLowerCase()))) {
    category = "Gatcha";
  } else if (vtuberNames.some((name) => lowerCaseKeywords.includes(name.toLowerCase()))) {
    category = "VTubers";
  } else if (animeNames.some((name) => lowerCaseKeywords.includes(name.toLowerCase()))) {
    category = "Anime";
  } else {
    category = "Others";
  }

  // Start scraping tasks based on the category
  let tasks = [
    scrapeOhgatchaProducts(keywords),
  ];

  const results = await Promise.all(tasks);
  const allProducts = {
    Ohgatcha: results[0],
  };

  Object.keys(allProducts).forEach((site) => {
    const productCount = allProducts[site].length;
    console.log(`Products from ${site}: ${productCount}/8`);
  });

  cache[keywords] = allProducts;
  return allProducts;
}

// ---------- Route Integration ----------
// Use compiled JS output to avoid build errors
import productRoutes from "./dist/route.js";
app.use("/api", productRoutes);

// ---------- GPT Fix: Dynamic Port Handling ----------
// ---------- GPT Fix: Dynamic Port Handling ----------
const DEFAULT_PORT = process.env.PORT || 10000; // Updated to 10000 for Render compatibility
let PORT = DEFAULT_PORT;

// FIX: Explicitly bind to 0.0.0.0 for external access on Render
const server = app.listen(PORT, "0.0.0.0", () => {
  logWithTimestamp(`Server running on http://0.0.0.0:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is in use. Trying another port...`);
    PORT = 0;
    const fallbackServer = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Fallback server running on http://0.0.0.0:${fallbackServer.address().port}`
      );
    });
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

// Health Check Route for Render
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

// Export scrapeAllProducts for testing
export { scrapeAllProducts };
