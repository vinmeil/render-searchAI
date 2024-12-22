const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs/promises');

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://malboro18games.com';

// Generate acronyms from a string
function generateAcronym(text) {
    return text
        .split(/\s+/) // Split by spaces
        .map(word => word.charAt(0)) // Take first letter of each word
        .join('').toLowerCase(); // Combine and lowercase
}

// Calculate acronym alignment score
function acronymScore(keywordAcronym, nameAcronym) {
    let score = 0;
    for (let i = 0; i < Math.min(keywordAcronym.length, nameAcronym.length); i++) {
        if (keywordAcronym[i] === nameAcronym[i]) {
            score += 10; // Reward exact match
        } else {
            score -= 5; // Penalize mismatch
        }
    }
    return score;
}

// Match and score menu items based on input
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

        // Acronym scoring
        if (keywordAcronym === nameAcronym) {
            scores.acronymExact = 200; // Exact acronym match
        } else {
            scores.acronymPartial = acronymScore(keywordAcronym, nameAcronym);
        }

        // Exact match
        if (nameLower === keywordLower) scores.keywordExact = 100;

        // Substring match
        if (nameLower.includes(keywordLower)) scores.substringMatch = 50;

        // Total score
        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
        return { item, scores, totalScore };
    });

    // Sort and return top 8 matches
    scoredMenus.sort((a, b) => b.totalScore - a.totalScore);
    return scoredMenus.slice(0, 8); // Top 8 matches
}

// Scrape the Malboro page
async function scrapeMalboro(keywords) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Go to home page and fetch menu links
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

        // Extract menu items
        const menus = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.list-menu__item'))
                .map(item => ({
                    name: item.innerText.trim(),
                    link: item.getAttribute('href')
                }));
        });

        // Match input keywords to the best menu links
        const topMatches = matchMenuItems(keywords, menus);

        // Pick the best match
        const bestMatch = topMatches[0].item;
        const targetURL = `${BASE_URL}${bestMatch.link}`;
        console.log(`Navigating to: ${targetURL}`);
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

        // **Return only top 8 products**
        return products.slice(0, 8); // Return only 8 accounts
    } catch (error) {
        console.error("Error scraping Malboro18Games:", error);
        return [];
    } finally {
        await browser.close();
    }
}

// Input keywords or default value
const keywords = process.argv[2] || 'fate grand order';
scrapeMalboro(keywords).then(products => {
    console.log(JSON.stringify(products, null, 2)); // Print JSON output of top 8 accounts
}).catch(error => {
    console.error("Error:", error);
});
