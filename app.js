require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
const { performance } = require('perf_hooks'); // Import performance module
const { ChatOllama } = require('@langchain/ollama');
const { ChatPromptTemplate } = require('@langchain/core/prompts');

// Initialize Express App
const app = express();
const cache = {}; // Cache for storing product results

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static'))); // Static files (CSS/JS)
app.set('view engine', 'ejs'); // Set EJS as template engine
app.set('views', path.join(__dirname, 'templates')); // Point views to 'templates'

// ---------- Utility for Timestamps ----------
function logWithTimestamp(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// ---------- Ollama Keyword Extractor ----------
const llm = new ChatOllama({
    model: 'llama3.1:latest', // Ensure exact model name
    temperature: 0.0,
    basePath: "http://127.0.0.1:11434", // Force IPv4 instead of localhost (::1)
});

async function keywordExtractor(query) {
    logWithTimestamp('Starting keyword extraction...');
    const prompt = ChatPromptTemplate.fromMessages([
        {
            role: 'system',
            content: `
                You are a keyword extractor that, given a user sentence or question, will extract a searchable product on an e-commerce site.
                Make sure to follow the guidelines below:
                1. Do not ask questions.
                2. Do not output a list.
                3. Output only a few words (keywords).
                4. If there are multiple keywords, only get the first one spaced correctly.
                5. If user query does not include any product reply with the query itself.
                6. If user searches for a product directly, use that as the keyword.
            `
        },
        { role: 'human', content: query }
    ]);

    const chain = prompt.pipe(llm);
    const result = await chain.invoke({ query });
    logWithTimestamp(`Extracted keywords: ${result.content.trim()}`);
    return result.content.trim();
}

// ---------- Helper Function for Puppeteer Scripts ----------
function runPuppeteerScript(script, keywords) {
    logWithTimestamp(`Running Puppeteer script: ${script} with keywords: ${keywords}`);
    return new Promise((resolve, reject) => {
        exec(`node puppeteer_scripts/${script} "${keywords}"`, (error, stdout, stderr) => {
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
        });
    });
}

// ---------- Scraping Functions ----------
async function scrapeSite(siteName, script, keywords) {
    const start = performance.now(); // Start time
    logWithTimestamp(`Scraping ${siteName}...`);
    const result = await runPuppeteerScript(script, keywords);
    const end = performance.now(); // End time
    logWithTimestamp(`Finished scraping ${siteName} in ${(end - start).toFixed(2)} ms`);
    return result;
}

async function scrapeCarousellProducts(keywords) {
    return await scrapeSite('Carousell', 'scrape_carousell.js', keywords);
}

async function scrapeOhgatchaProducts(keywords) {
    return await scrapeSite('Ohgatcha', 'scrape_ohgatcha.js', keywords);
}

async function scrapeGoodSmileProducts(keywords) {
    return await scrapeSite('Goodsmile', 'scrape_goodsmile.js', keywords);
}

async function scrapeNijisanjiProducts(keywords) {
    return await scrapeSite('Nijisanji', 'scrape_nijisanji.js', keywords);
}

async function scrapeAnimateProducts(keywords) {
    return await scrapeSite('Animate', 'scrape_animate.js', keywords);
}

async function scrapeHobilityProducts(keywords) {
    return await scrapeSite('Hobility', 'scrape_hobility.js', keywords);
}

async function scrapeShirotoysProducts(keywords) {
    return await scrapeSite('Shirotoys', 'scrape_shirotoys.js', keywords);
}

async function scrapeSkyeProducts(keywords) {
    return await scrapeSite('Skye', 'scrape_skye.js', keywords);
}

async function scrapeGanknowProducts(keywords) {
    return await scrapeSite('Ganknow', 'scrape_ganknow.js', keywords);
}

async function scrapeMalboroProducts(keywords) {
    return await scrapeSite('Malboro', 'scrape_malboro.js', keywords);
}

// ---------- Combine Scraping Results ----------
async function scrapeAllProducts(keywords) {
    logWithTimestamp(`Starting scraping for keywords: ${keywords}`);
    if (cache[keywords]) {
        logWithTimestamp(`Fetching cached results for: ${keywords}`);
        return cache[keywords];
    }

    const tasks = [
        scrapeCarousellProducts(keywords),
        scrapeOhgatchaProducts(keywords),
        scrapeGoodSmileProducts(keywords),
        scrapeNijisanjiProducts(keywords),
        scrapeAnimateProducts(keywords),
        scrapeHobilityProducts(keywords),
        scrapeShirotoysProducts(keywords),
        scrapeSkyeProducts(keywords),
        scrapeGanknowProducts(keywords),
        scrapeMalboroProducts(keywords)
    ];

    const results = await Promise.all(tasks);

    const allProducts = {
        Carousell: results[0],
        Ohgatcha: results[1],
        GoodSmile: results[2],
        Nijisanji: results[3],
        Animate: results[4],
        Hobility: results[5],
        Shirotoys: results[6],
        Skye: results[7],
        Ganknow: results[8],
        Malboro: results[9]
    };

    cache[keywords] = allProducts;
    logWithTimestamp(`Completed scraping for keywords: ${keywords}`);
    return allProducts;
}

// ---------- Routes ----------
app.get('/', (req, res) => res.render('index'));

app.post('/search', async (req, res) => {
    const query = req.body.query;
    logWithTimestamp(`Query received: ${query}`);

    const keywords = await keywordExtractor(query);
    logWithTimestamp(`Extracted keywords: ${keywords}`);

    const products = await scrapeAllProducts(keywords);
    res.render('products', { products });
    logWithTimestamp(`Rendering products for keywords: ${keywords}`);
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logWithTimestamp(`Server running on http://localhost:${PORT}`));
