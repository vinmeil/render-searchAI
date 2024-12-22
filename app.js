require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
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

// ---------- Ollama Keyword Extractor ----------
const llm = new ChatOllama({
    model: 'llama3.1:latest', // Ensure exact model name
    temperature: 0.0,
    basePath: "http://127.0.0.1:11434", // Force IPv4 instead of localhost (::1)
});

async function keywordExtractor(query) {
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
    return result.content.trim();
}

// ---------- Helper Function for Puppeteer Scripts ----------
function runPuppeteerScript(script, keywords) {
    return new Promise((resolve, reject) => {
        exec(`node puppeteer_scripts/${script} "${keywords}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error running ${script}:`, stderr);
                resolve([]); // Return empty array on error
                return;
            }
            try {
                resolve(JSON.parse(stdout)); // Parse JSON output
            } catch (err) {
                console.error('JSONDecodeError:', err);
                console.error('Output was:', stdout);
                resolve([]); // Return empty array if JSON fails
            }
        });
    });
}

// ---------- Scraping Functions ----------
async function scrapeCarousellProducts(keywords) {
    console.log('Scraping Carousell...');
    return await runPuppeteerScript('scrape_carousell.js', keywords);
}

async function scrapeOhgatchaProducts(keywords) {
    console.log('Scraping Ohgatcha...');
    return await runPuppeteerScript('scrape_ohgatcha.js', keywords);
}

async function scrapeGoodSmileProducts(keywords) {
    console.log('Scraping Goodsmile...');
    return await runPuppeteerScript('scrape_goodsmile.js', keywords);
}

async function scrapeNijisanjiProducts(keywords) {
    console.log('Scraping Nijisanji...');
    return await runPuppeteerScript('scrape_nijisanji.js', keywords);
}

async function scrapeMercariProducts(keywords) {
    console.log('Scraping Mercari...');
    return await runPuppeteerScript('scrape_mercari.js', keywords);
}

async function scrapeAnimateProducts(keywords) {
    console.log('Scraping Animate...');
    return await runPuppeteerScript('scrape_animate.js', keywords);
}

async function scrapeHobilityProducts(keywords) {
    console.log('Scraping Hobility...');
    return await runPuppeteerScript('scrape_hobility.js', keywords);
}

async function scrapeShirotoysProducts(keywords) {
    console.log('Scraping Shirotoys...');
    return await runPuppeteerScript('scrape_shirotoys.js', keywords);
}

async function scrapeSkyeProducts(keywords) {
    console.log('Scraping Skye...');
    return await runPuppeteerScript('scrape_skye.js', keywords);
}

async function scrapeGanknowProducts(keywords) {
    console.log('Scraping Ganknow...');
    return await runPuppeteerScript('scrape_ganknow.js', keywords);
}

// ---------- Combine Scraping Results ----------
async function scrapeAllProducts(keywords) {
    console.log("Keywords inside function:", keywords)
    if (cache[keywords]) {
        console.log(`Fetching cached results for: ${keywords}`);
        return cache[keywords];
    }

    const tasks = [
        scrapeCarousellProducts(keywords),
        scrapeOhgatchaProducts(keywords),
        scrapeGoodSmileProducts(keywords),
        scrapeNijisanjiProducts(keywords),
        // scrapeMercariProducts(keywords),
        scrapeAnimateProducts(keywords),
        scrapeHobilityProducts(keywords),
        scrapeShirotoysProducts(keywords),
        scrapeSkyeProducts(keywords),
        scrapeGanknowProducts(keywords),
    ];

    const results = await Promise.all(tasks);

    const allProducts = {
        Carousell: results[0],
        Ohgatcha: results[1],
        GoodSmile: results[2],
        Nijisanji: results[3],
        Mercari: results[4],
        Animate: results[5],
        Hobility: results[6],
        Shirotoys: results[7],
        Skye: results[8],
        Ganknow: results[9],
    };

    cache[keywords] = allProducts;
    return allProducts;
}

// ---------- Routes ----------
app.get('/', (req, res) => res.render('index'));

app.post('/search', async (req, res) => {
    const query = req.body.query;
    console.log(`Query request from HTML: ${query}`);

    const keywords = await keywordExtractor(query);
    console.log(`Extracted keywords are: ${keywords}`);

    const products = await scrapeAllProducts(keywords);
    res.render('products', { products });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
