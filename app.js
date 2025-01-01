import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { exec } from "child_process";
import { performance } from "perf_hooks"; // Import performance module
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Load environment variables
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

async function scrapeOhgatchaProducts(keywords) {
  return await scrapeSite("Ohgatcha", "scrape_ohgatcha.js", keywords);
}

// Load text files into memory
const gatchaNames = fs.readFileSync(path.join(path.resolve(), 'rag_data/Xgatcha_names.txt'), 'utf-8').split('\n').map(name => name.trim());
const vtuberNames = fs.readFileSync(path.join(path.resolve(), 'rag_data/Xvtuber_names.txt'), 'utf-8').split('\n').map(name => name.trim());
const animeNames = fs.readFileSync(path.join(path.resolve(), 'rag_data/Xanime_names.txt'), 'utf-8').split('\n').map(name => name.trim());

// ---------- Scraping Function ----------
async function scrapeAllProducts(keywords) {
  logWithTimestamp(`Starting scraping for keywords: ${keywords}`);

  // Check cache first
  if (cache[keywords]) {
    logWithTimestamp(`Fetching cached results for: ${keywords}`);
    return cache[keywords];
  }

  const results = await Promise.all([
    scrapeOhgatchaProducts(keywords),
  ]);

  const allProducts = {
    Ohgatcha: results[0],
  };

  Object.keys(allProducts).forEach(site => {
    const productCount = allProducts[site].length;
    console.log(`Products from ${site}: ${productCount}/8`);
  });

  // Cache the results
  cache[keywords] = allProducts;
  return allProducts;
}

// ---------- Dynamic Port Handling ----------
const DEFAULT_PORT = process.env.PORT || 8080;
let PORT = DEFAULT_PORT;

const server = app.listen(PORT, () => {
  logWithTimestamp(`Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is in use. Trying another port...`);
    PORT = 0; // Automatically assign a free port
    const fallbackServer = app.listen(PORT, () => {
      console.log(
        `Fallback server running on http://localhost:${fallbackServer.address().port}`
      );
    });
  } else {
    console.error("Server error:", err);
    process.exit(1); // Exit the process for non-port errors
  }
});

// ---------- Export Functions for TypeScript ----------
export { scrapeAllProducts, keywordExtractor2 };
