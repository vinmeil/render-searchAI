require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');

// Initialize Express App
const app = express();
const cache = {}; // Cache for storing product results

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static'))); // For static files (CSS/JS)
app.set('view engine', 'ejs'); // Set EJS as template engine
app.set('views', path.join(__dirname, 'templates')); // Point views to 'templates'

// Helper function to run Puppeteer scripts
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

// Scraping functions for each source
async function scrapeSkyeProducts(keywords) {
    console.log('Scraping Skye...');
    return await runPuppeteerScript('scrape_skye.js', keywords);
}

async function scrapeMalboroProducts(keywords) {
    console.log('Scraping Malboro...');
    return await runPuppeteerScript('scrape_malboro.js', keywords);
}

// Combine scraping results
async function scrapeAllProducts(keywords) {
    console.log("Keywords inside function:", keywords);

    // Use cache if results already exist
    if (cache[keywords]) {
        console.log(`Fetching cached results for: ${keywords}`);
        return cache[keywords];
    }

    // Run all scraping tasks in parallel
    const tasks = [
        scrapeSkyeProducts(keywords),
        scrapeMalboroProducts(keywords),
    ];

    const results = await Promise.all(tasks);

    // Format results into categories
    const allProducts = {
        Skye: results[0],       // Results from Skye
        Malboro: results[1],   // Results from Malboro
    };

    // Cache results for later use
    cache[keywords] = allProducts;
    return allProducts;
}

// Mock keyword extraction function
async function extractKeywords(query) {
    // Example: Use the first two words as keywords
    return query.split(" ").slice(0, 2).join(" ");
}

// Routes
app.get('/', (req, res) => {
    res.render('index'); // Render index.ejs
});

app.post('/search', async (req, res) => {
    const query = req.body.query; // Get user query
    console.log(`Query request: ${query}`);

    const keywords = await extractKeywords(query); // Extract keywords
    console.log(`Extracted keywords: ${keywords}`);

    if (!keywords) {
        res.send('No valid keywords found.');
        return;
    }

    const products = await scrapeAllProducts(keywords); // Get products
    console.log('Products:', products); // Debugging output
    res.render('products', { products }); // Render products.ejs
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
