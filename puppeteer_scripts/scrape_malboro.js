const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://malboro18games.com';

// Generate acronyms
function generateAcronym(text) {
    return text
        .split(/\s+/)
        .map(word => word.charAt(0))
        .join('').toLowerCase();
}

// Calculate acronym match score
function acronymScore(keywordAcronym, nameAcronym) {
    let score = 0;
    for (let i = 0; i < Math.min(keywordAcronym.length, nameAcronym.length); i++) {
        if (keywordAcronym[i] === nameAcronym[i]) score += 10;
        else score -= 5;
    }
    return score;
}

// Match and score menu items
function matchMenuItems(keywords, menus) {
    const keywordLower = keywords.toLowerCase().replace(/[^a-z0-9]/g, '');
    const keywordAcronym = generateAcronym(keywords);

    const scoredMenus = menus.map(item => {
        const nameLower = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameAcronym = generateAcronym(item.name);

        let scores = {
            acronymExact: 0,
            acronymPartial: 0,
            keywordExact: 0,
            substringMatch: 0,
        };

        // Scoring
        if (keywordAcronym === nameAcronym) scores.acronymExact = 200;
        else scores.acronymPartial = acronymScore(keywordAcronym, nameAcronym);

        if (nameLower === keywordLower) scores.keywordExact = 100;
        if (nameLower.includes(keywordLower)) scores.substringMatch = 50;

        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
        return { item, totalScore };
    });

    scoredMenus.sort((a, b) => b.totalScore - a.totalScore);
    return scoredMenus.slice(0, 8); // Top 8 matches
}

// Scrape the Malboro site
async function scrapeMalboro(keywords) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Open the website
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

        // Extract menus
        const menus = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.list-menu__item')).map(item => ({
                name: item.innerText.trim(),
                link: item.getAttribute('href')
            }));
        });

        // Find top matches
        const topMatches = matchMenuItems(keywords, menus);
        const bestMatch = topMatches[0]?.item;
        const targetURL = `${BASE_URL}${bestMatch.link}`;

        // Navigate to the best match
        await page.goto(targetURL, { waitUntil: 'networkidle2' });

        // Extract products
        const products = await page.evaluate(() => {
            const baseURL = 'https://malboro18games.com';
            const productElements = document.querySelectorAll('.card-wrapper.product-card-wrapper');

            return Array.from(productElements).map(element => {
                const imgElement = element.querySelector('.card__media img');
                const imgLink = imgElement
                    ? (imgElement.getAttribute('src').startsWith('//')
                        ? `https:${imgElement.getAttribute('src')}`
                        : `${baseURL}${imgElement.getAttribute('src')}`)
                    : '';

                const nameElement = element.querySelector('.card__heading a');
                const name = nameElement ? nameElement.textContent.trim() : '';

                const linkElement = element.querySelector('.card__heading a');
                const productLink = linkElement
                    ? `${baseURL}${linkElement.getAttribute('href')}`
                    : '';

                const priceElement = element.querySelector('.price__sale .money') ||
                                     element.querySelector('.price__regular .money');
                const price = priceElement ? priceElement.textContent.trim() : '';

                return {
                    name,
                    price,
                    img_link: imgLink,
                    product_link: productLink,
                };
            });
        });

        // Output JSON only
        console.log(JSON.stringify(products.slice(0, 8))); // Only top 8 products
    } catch (error) {
        console.error(JSON.stringify({ error: "Scraping failed", details: error.toString() }));
    } finally {
        await browser.close();
    }
}

// Input keywords or default value
const keywords = process.argv[2] || 'fate grand order';
scrapeMalboro(keywords).catch(error => console.error(JSON.stringify({ error: "Execution failed", details: error.toString() })));
