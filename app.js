// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const { exec } = require('child_process');
// const path = require('path');

// const app = express();
// const cache = {};

// // Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// // Helper function to run Puppeteer scripts
// function runPuppeteerScript(script, keywords) {
//     return new Promise((resolve, reject) => {
//         exec(`node ${script} "${keywords}"`, (error, stdout, stderr) => {
//             if (error) {
//                 console.error(`Error running ${script}:`, stderr);
//                 resolve([]);
//                 return;
//             }
//             try {
//                 resolve(JSON.parse(stdout));
//             } catch (err) {
//                 console.error('JSONDecodeError:', err);
//                 console.error('Output was:', stdout);
//                 resolve([]);
//             }
//         });
//     });
// }

// // Scraping functions
// async function scrapeCarousellProducts(keywords) {
//     console.log('Scraping Carousell...');
//     return await runPuppeteerScript('puppeteer_scripts/scrape_carousell.js', keywords);
// }

// async function scrapeZaloraProducts(keywords) {
//     console.log('Scraping Zalora...');
//     return await runPuppeteerScript('puppeteer_scripts/scrape_zalora.js', keywords);
// }

// async function scrapePgmallProducts(keywords) {
//     console.log('Scraping PGMall...');
//     return await runPuppeteerScript('puppeteer_scripts/scrape_pgmall.js', keywords);
// }

// async function scrapeOhgatchaProducts(keywords) {
//     console.log('Scraping Ohgatcha...');
//     return await runPuppeteerScript('puppeteer_scripts/scrape_ohgatcha.js', keywords);
// }

// async function scrapeGoodsmileProducts(keywords) {
//     console.log('Scraping Goodsmile...');
//     return await runPuppeteerScript('puppeteer_scripts/scrape_goodsmile.js', keywords);
// }

// async function scrapeAllProducts(keywords) {
//     if (cache[keywords]) {
//         console.log(`Fetching cached results for: ${keywords}`);
//         return cache[keywords];
//     }

//     const carousellProducts = await scrapeCarousellProducts(keywords);
//     console.log('Done!');
//     const zaloraProducts = await scrapeZaloraProducts(keywords);
//     console.log('Done!');
//     const pgmallProducts = await scrapePgmallProducts(keywords);
//     console.log('Done!');
//     const ohgatchaProducts = await scrapeOhgatchaProducts(keywords);
//     console.log('Done!');
//     const goodsmileProducts = await scrapeGoodsmileProducts(keywords);
//     console.log('Done!');

//     const allProducts = {
//         Carousell: carousellProducts,
//         Zalora: zaloraProducts,
//         PGMall: pgmallProducts,
//         Ohgatcha: ohgatchaProducts,
//         GoodSmile: goodsmileProducts,
//     };

//     cache[keywords] = allProducts;
//     return allProducts;
// }

// // Dummy keyword extractor function (replace with a real one if needed)
// function keywordExtractor(query) {
//     // Implement a logic similar to the original LLM-based extractor if needed
//     if (!query || query.trim() === '') return 'NONE';
//     return query.split(',')[0].trim(); // Example: Extract the first keyword
// }

// // Routes
// app.get('/', (req, res) => {
//     res.render('index');
// });


// app.post('/search', async (req, res) => {
//     const query = req.body.query;
//     console.log(`Query request from HTML: ${query}`);
//     const keywords = keywordExtractor(query);
//     console.log(`Extracted keywords are: ${keywords}`);

//     if (keywords.toLowerCase() === 'none') {
//         res.send('No valid keywords found.');
//         return;
//     }

//     const products = await scrapeAllProducts(keywords);
//     res.render('products', { products });
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });




require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const { ChatOllama } = require('@langchain/ollama');
const { ChatPromptTemplate } = require('@langchain/core/prompts');

const app = express();
const cache = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper function to run Puppeteer scripts
function runPuppeteerScript(script, keywords) {
    return new Promise((resolve, reject) => {
        exec(`node ${script} "${keywords}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error running ${script}:`, stderr);
                resolve([]);
                return;
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (err) {
                console.error('JSONDecodeError:', err);
                console.error('Output was:', stdout);
                resolve([]);
            }
        });
    });
}

// Scraping functions
async function scrapeCarousellProducts(keywords) {
    console.log('Scraping Carousell...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_carousell.js', keywords);
}

async function scrapeZaloraProducts(keywords) {
    console.log('Scraping Zalora...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_zalora.js', keywords);
}

async function scrapePgmallProducts(keywords) {
    console.log('Scraping PGMall...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_pgmall.js', keywords);
}

async function scrapeOhgatchaProducts(keywords) {
    console.log('Scraping Ohgatcha...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_ohgatcha.js', keywords);
}

async function scrapeGoodsmileProducts(keywords) {
    console.log('Scraping Goodsmile...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_goodsmile.js', keywords);
}

async function scrapeHololiveProducts(keywords) {
    console.log('Scraping Hololive...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_hololive.js', keywords);
}

async function scrapeNijisanjiProducts(keywords) {
    console.log('Scraping Nijisanji...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_nijisanji.js', keywords);
}

async function scrapeMercariProducts(keywords) {
    console.log('Scraping Mercari...');
    return await runPuppeteerScript('puppeteer_scripts/scrape_mercari.js', keywords);
}

async function scrapeAllProducts(keywords) {
    console.log("Keywords inside function:", keywords)
    if (cache[keywords]) {
        console.log(`Fetching cached results for: ${keywords}`);
        return cache[keywords];
    }

    const tasks = [
        scrapeCarousellProducts(keywords),
        scrapeZaloraProducts(keywords),
        scrapePgmallProducts(keywords),
        scrapeOhgatchaProducts(keywords),
        scrapeGoodsmileProducts(keywords),
        scrapeHololiveProducts(keywords),
        scrapeNijisanjiProducts(keywords),
        scrapeMercariProducts(keywords)
    ];

    const results = await Promise.all(tasks);

    const allProducts = {
        Carousell: results[0],
        Zalora: results[1],
        PGMall: results[2],
        Ohgatcha: results[3],
        GoodSmile: results[4],
        Hololive: results[5],
        Nijisanji: results[6],
        Mercari: results[7]
    };

    cache[keywords] = allProducts;
    return allProducts;
}

// Keyword extractor using LangChain-based model
async function keywordExtractor(query) {
    const llm = new ChatOllama({ model: 'llama3.1', temperature: 0.0 });
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
    return result.content;
}


// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', async (req, res) => {
    const query = req.body.query;
    console.log(`Query request from HTML: ${query}`);

    const keywords = await keywordExtractor(query);
    console.log(`Extracted keywords are: ${keywords}`);

    if (keywords.toLowerCase() === 'none') {
        res.send('No valid keywords found.');
        return;
    }

    const products = await scrapeAllProducts(keywords);
    res.render('products', { products });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

