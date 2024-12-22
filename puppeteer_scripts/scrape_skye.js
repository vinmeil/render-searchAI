const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://www.skye1204gaming.com';

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

// Matching algorithm with detailed scoring
function matchMenuItems(keywords, menus) {
    const keywordLower = keywords.toLowerCase().replace(/[^a-z0-9]/g, ''); // Normalize keywords
    const keywordAcronym = generateAcronym(keywords); // Generate acronym for keywords

    const scoredMenus = menus.map(item => {
        const nameLower = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameAcronym = generateAcronym(item.name);

        let scores = {
            acronymExact: 0,
            acronymPartial: 0,
            keywordExact: 0,
            substringMatch: 0,
        };

        // 1. Exact acronym match - Highest priority
        if (keywordAcronym === nameAcronym) {
            scores.acronymExact = 200;
        } else {
            scores.acronymPartial = acronymScore(keywordAcronym, nameAcronym);
        }

        // 2. Exact keyword match
        if (nameLower === keywordLower) scores.keywordExact = 100;

        // 3. Substring match
        if (nameLower.includes(keywordLower)) scores.substringMatch = 50;

        // Total score
        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
        return { item, totalScore };
    });

    // Sort by score and return top 5 matches
    scoredMenus.sort((a, b) => b.totalScore - a.totalScore);
    return scoredMenus.slice(0, 5); // Top 5 matches
}

// Scrape Skye with JSON output
async function scrapeSkye(keywords) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Navigate to the main page
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

        // Extract menu items (categories)
        const menus = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.list-menu__item')).map(item => ({
                name: item.innerText.trim(),
                link: item.getAttribute('href')
            }));
        });

        // Match keywords with menus using scoring logic
        const topMatches = matchMenuItems(keywords, menus);

        // Pick the best match
        const bestMatch = topMatches[0]?.item;

        // If no match is found, return an empty array
        if (!bestMatch || !bestMatch.link) {
            return [];
        }

        // Navigate to the matched category page
        const categoryURL = `${BASE_URL}${bestMatch.link}`;
        await page.goto(categoryURL, { waitUntil: 'networkidle2' });

        // Extract products
        const products = await page.evaluate((baseURL) => {
            const productElements = document.querySelectorAll('.card-wrapper.product-card-wrapper');

            return Array.from(productElements).map(element => {
                // Extract Image
                const imgElement = element.querySelector('.card__media img');
                const imgLink = imgElement
                    ? (imgElement.getAttribute('src').startsWith('//')
                        ? `https:${imgElement.getAttribute('src')}`
                        : `${baseURL}${imgElement.getAttribute('src')}`)
                    : '';

                // Extract Name
                const nameElement = element.querySelector('.card__heading a');
                const name = nameElement ? nameElement.textContent.trim() : 'No Name';

                // Extract Price
                const priceElement = element.querySelector('.price__sale .money') || 
                                     element.querySelector('.price__regular .money');
                const price = priceElement ? priceElement.textContent.trim() : 'N/A';

                // Extract Product Link
                const linkElement = element.querySelector('.card__heading a');
                const productLink = linkElement
                    ? `${baseURL}${linkElement.getAttribute('href')}`
                    : '';

                // Return JSON format
                return {
                    name,
                    price,
                    img_link: imgLink,
                    product_link: productLink,
                };
            });
        }, BASE_URL);

        // Return only top 8 products
        return products.slice(0, 8);

    } catch (error) {
        console.error("Error scraping Skye:", error);
        return [];
    } finally {
        await browser.close();
    }
}

// Keywords from arguments or default
const keywords = process.argv[2] || 'fate grand order';
scrapeSkye(keywords)
    .then(products => {
        // Output valid JSON only
        console.log(JSON.stringify(products, null, 2));
    })
    .catch(error => {
        console.error(JSON.stringify({ error: "Scraping failed", details: error.toString() }));
    });
