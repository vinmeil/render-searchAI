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

async function scrapeCarousellProducts(keywords) {
  return await scrapeSite("Carousell", "scrape_carousell.js", keywords);
}

async function scrapeZaloraProducts(keywords) {
  return await scrapeSite("Zalora", "scrape_zalora.js", keywords);
}

async function scrapeOhgatchaProducts(keywords) {
  return await scrapeSite("Ohgatcha", "scrape_ohgatcha.js", keywords);
}

async function scrapeGoodSmileProducts(keywords) {
  return await scrapeSite("GoodSmile", "scrape_goodsmile.js", keywords);
}

async function scrapeAnimateProducts(keywords) {
  return await scrapeSite("Animate", "scrape_animate.js", keywords);
}

async function scrapeHobilityProducts(keywords) {
  return await scrapeSite("Hobility", "scrape_hobility.js", keywords);
}

async function scrapeHololiveProducts(keywords) {
  return await scrapeSite("Hololive", "scrape_hololive.js", keywords);
}

async function scrapeNijisanjiProducts(keywords) {
  return await scrapeSite("Nijisanji", "scrape_nijisanji.js", keywords);
}

async function scrapeShirotoysProducts(keywords) {
  return await scrapeSite("Shirotoys", "scrape_shirotoys.js", keywords);
}

async function scrapeSkyeProducts(keywords) {
  return await scrapeSite("Skye", "scrape_skye.js", keywords);
}

async function scrapeMalboroProducts(keywords) {
  return await scrapeSite("Malboro", "scrape_malboro.js", keywords);
}

async function scrapeMercariProducts(keywords) {
  return await scrapeSite("Mercari", "scrape_mercari.js", keywords);
}

async function scrapeEpicnpcProducts(keywords) {
  return await scrapeSite("EpicNPC", "scrape_epicnpc.js", keywords);
}

// Load text files into memory
// const gatchaNames = fs.readFileSync(path.join(__dirname, 'rag_data/Xgatcha_names.txt'), 'utf-8').split('\n').map(name => name.trim());
// const vtuberNames = fs.readFileSync(path.join(__dirname, 'rag_data/Xvtuber_names.txt'), 'utf-8').split('\n').map(name => name.trim());
// const animeNames = fs.readFileSync(path.join(__dirname, 'rag_data/Xanime_names.txt'), 'utf-8').split('\n').map(name => name.trim());
const gatchaNames = fs.readFileSync(path.join(path.resolve(), 'rag_data/Xgatcha_names.txt'), 'utf-8').split('\n').map(name => name.trim());
const vtuberNames = fs.readFileSync(path.join(path.resolve(), 'rag_data/Xvtuber_names.txt'), 'utf-8').split('\n').map(name => name.trim());
const animeNames = fs.readFileSync(path.join(path.resolve(), 'rag_data/Xanime_names.txt'), 'utf-8').split('\n').map(name => name.trim());


async function scrapeAllProducts(keywords) {
  logWithTimestamp(`Starting scraping for keywords: ${keywords}`);
  
  // Check cache first
  if (cache[keywords]) {
      logWithTimestamp(`Fetching cached results for: ${keywords}`);
      return cache[keywords];
  }

  // Determine the category based on the keyword
  console.log('Reading txt files...');
  let category;
  const lowerCaseKeywords = keywords.toLowerCase();
  if (gatchaNames.some(name => lowerCaseKeywords.includes(name.toLowerCase()))) {
      category = 'Gatcha';
  } else if (vtuberNames.some(name => lowerCaseKeywords.includes(name.toLowerCase()))) {
      category = 'VTubers';
  } else if (animeNames.some(name => lowerCaseKeywords.includes(name.toLowerCase()))) {
      category = 'Anime';
  } else {
      category = 'Others';
  }

  // Start scraping tasks based on the category
  let tasks;
  // if (category === 'Gatcha') {
  //     console.log("Category: Gatcha");
  //     tasks = [
  //         scrapeCarousellProducts(keywords),
  //         scrapeSkyeProducts(keywords),
  //         scrapeMalboroProducts(keywords),
  //     ];
  // } else if (category === 'VTubers') {
  //     console.log("Category: VTubers");
  //     tasks = [
  //         scrapeCarousellProducts(keywords),
  //         scrapeOhgatchaProducts(keywords),
  //         scrapeGoodSmileProducts(keywords),
  //         scrapeAnimateProducts(keywords),
  //         scrapeHobilityProducts(keywords),
  //         scrapeHololiveProducts(keywords),
  //         scrapeNijisanjiProducts(keywords),
  //         scrapeShirotoysProducts(keywords),
  //     ];
  // } else if (category === 'Anime') {
  //     console.log("Category: Anime");
  //     tasks = [
  //         scrapeCarousellProducts(keywords),
  //         scrapeOhgatchaProducts(keywords),
  //         scrapeGoodSmileProducts(keywords),
  //         scrapeAnimateProducts(keywords),
  //         scrapeHobilityProducts(keywords),
  //         scrapeShirotoysProducts(keywords),
  //         scrapeMercariProducts(keywords),
  //     ];
  // } else {  // Clothes or other products
  //     console.log("Category: Others");
  //     tasks = [
  //         scrapeCarousellProducts(keywords),
  //         scrapeZaloraProducts(keywords),
  //         scrapePgmallProducts(keywords),
  //         scrapeMercariProducts(keywords),
  //     ];
  // }
  tasks = [
      // scrapeCarousellProducts(keywords),
      // scrapeZaloraProducts(keywords),
      // scrapeMercariProducts(keywords),
      // scrapeGoodSmileProducts(keywords),
      // scrapeMalboroProducts(keywords),
      // scrapeSkyeProducts(keywords),
      scrapeOhgatchaProducts(keywords),
      // scrapeAnimateProducts(keywords),
      // scrapeHobilityProducts(keywords),
      // scrapeHololiveProducts(keywords),
      // scrapeNijisanjiProducts(keywords),
      // scrapeShirotoysProducts(keywords),
      // scrapePgmallProducts(keywords),

  ];

  // Wait for all scraping tasks to complete
  const results = await Promise.all(tasks);

  // Combine results into a structured object
  const allProducts = {};
  // if (category === 'Gatcha') {
  //     allProducts.Carousell = results[0];
  //     allProducts.Skye = results[1];
  //     allProducts.Malboro = results[2];
  // } else if (category === 'VTubers') {
  //     allProducts.Carousell = results[0];
  //     allProducts.Ohgatcha = results[1];
  //     allProducts.GoodSmile = results[2];
  //     allProducts.Animate = results[3];
  //     allProducts.Hobility = results[4];
  //     allProducts.Hololive = results[5];
  //     allProducts.Nijisanji = results[6];
  //     allProducts.Shirotoys = results[7];
  // } else if (category === 'Anime') { // TODO: Check if Hololive and Nijisanji are Vtuber and Anime, or just Vtuber
  //     allProducts.Carousell = results[0];
  //     allProducts.Ohgatcha = results[1];
  //     allProducts.GoodSmile = results[2];
  //     allProducts.Animate = results[3];
  //     allProducts.Hobility = results[4]; // TODO: only VTuber?
  //     allProducts.Shirotoys = results[5];
  //     allProducts.Mercari = results[6];
  // } else {  // Clothes or other products
  //     allProducts.Carousell = results[0];
  //     allProducts.Zalora = results[1];
  //     allProducts.PGMall = results[2];
  //     allProducts.Mercari = results[3];
  // }
      // Ganknow: results[13],
      // EpicNPC: results[14],

      // allProducts.Carousell = results[0];
      // allProducts.Zalora = results[0];
      // allProducts.Mercari = results[1];
      // allProducts.GoodSmile = results[0];
      // allProducts.Malboro = results[0];
      // allProducts.Skye = results[0];
      allProducts.Ohgatcha = results[0];
      // allProducts.Animate = results[1];
      // allProducts.Hobility = results[0];
      // allProducts.Hololive = results[0];
      // allProducts.Nijisanji = results[0];
      // allProducts.Shirotoys = results[0];
      // allProducts.PGMall = results[0];

  Object.keys(allProducts).forEach(site => {
      const productCount = allProducts[site].length;
      console.log(`Products from ${site}: ${productCount}/8`);
  });

  // Cache the results
  cache[keywords] = allProducts;
  return allProducts;
}


// ---------- Route Integration ----------
import productRoutes from "./route"; // Import route.ts
app.use("/api", productRoutes); // Use routes

// ---------- GPT Fix: Dynamic Port Handling ----------
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

// Export scrapeAllProducts for testing
export { scrapeAllProducts };
