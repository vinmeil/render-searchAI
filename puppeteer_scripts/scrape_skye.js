const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

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

    // Compare each letter in sequence
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

    // Calculate scores for all menus
    const scoredMenus = menus.map(item => {
        const nameLower = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const linkLower = item.link.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameAcronym = generateAcronym(item.name); // Generate acronym for menu name

        let scores = {
            acronymExact: 0,
            acronymPartial: 0,
            keywordExact: 0,
            substringMatch: 0,
        };

        // 1. Exact acronym match - Highest priority
        if (keywordAcronym === nameAcronym) {
            scores.acronymExact = 200; // Exact acronym match
        } else {
            scores.acronymPartial = acronymScore(keywordAcronym, nameAcronym); // Partial acronym alignment
        }

        // 2. Exact keyword match
        if (nameLower === keywordLower || linkLower.includes(keywordLower)) {
            scores.keywordExact = 100; // Exact match
        }

        // 3. Substring match
        if (nameLower.includes(keywordLower) || linkLower.includes(keywordLower)) {
            scores.substringMatch = 50; // Substring match
        }

        // Total score
        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);

        return { item, scores, totalScore };
    });

    // Sort menus by total score (descending) and return top 5
    scoredMenus.sort((a, b) => b.totalScore - a.totalScore);
    return scoredMenus.slice(0, 5); // Return top 5 matches
}

async function scrapeSkye(keywords) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Visit the site and save HTML
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        const html = await page.content();
        fs.writeFileSync('debug.html', html);
        // console.log('HTML content saved to debug.html');

        // Extract menu items using regex
        const menuRegex = /<a id="HeaderDrawer-[^"]+" href="(\/collections\/[^"]+)"[^>]*?class="menu-drawer__menu-item[^"]*">([\s\S]*?)<\/a>/g;
        let match;
        const menus = [];

        while ((match = menuRegex.exec(html)) !== null) {
            menus.push({
                name: match[2].trim(),
                link: match[1].trim(),
            });
        }

        // console.log("Extracted Menus:", menus);

        // Match menu items using strict scoring
        const topMatches = matchMenuItems(keywords, menus);

        // Print the top 5 matches with detailed scores
        // console.log('Top 5 Matches with Scores:');
        topMatches.forEach((match, index) => {
            // console.log(`${index + 1}. ${match.item.name} (${BASE_URL}${match.item.link}) - Total Score: ${match.totalScore}`);
            // console.log(`   Acronym Exact: ${match.scores.acronymExact}`);
            // console.log(`   Acronym Partial: ${match.scores.acronymPartial}`);
            // console.log(`   Keyword Exact: ${match.scores.keywordExact}`);
            // console.log(`   Substring Match: ${match.scores.substringMatch}`);
        });

        // Pick the best match
        const bestMatch = topMatches[0].item;

        // Handle no match found
        if (!bestMatch || !bestMatch.link) {
            // console.log('No matching keyword found.');
            return [];
        }

        // Navigate to the best match page
        const URL = `${BASE_URL}${bestMatch.link}`;
        // console.log(`Navigating to: ${URL}`);
        await page.goto(URL, { waitUntil: 'networkidle2' });

        // Extract product details
        const products = await page.evaluate((baseURL) => {
            const productElements = document.querySelectorAll('.card-wrapper.product-card-wrapper');
            return Array.from(productElements).map(element => {
                const imgElement = element.querySelector('.media img');
                const nameElement = element.querySelector('.card__heading a');
                const priceElement = element.querySelector('.price__sale .price-item--sale');

                return {
                    name: nameElement ? nameElement.textContent.trim() : '',
                    price: priceElement ? priceElement.textContent.trim() : '',
                    img_link: imgElement
                        ? (imgElement.getAttribute('src').startsWith('//')
                            ? `https:${imgElement.getAttribute('src')}` // Handle "//" links
                            : `${baseURL}${imgElement.getAttribute('src')}`) // Prepend baseURL for relative paths
                        : '',
                    product_link: nameElement
                        ? `${baseURL}${nameElement.getAttribute('href')}` // Prepend baseURL for product links
                        : '',
                };
            });
        }, BASE_URL);

        return products;
    } catch (error) {
        console.error("Error scraping Skye1204Gaming:", error);
        return [];
    } finally {
        await browser.close();
    }
}

// Keywords from arguments or default
const keywords = process.argv[2] || 'zzz';
scrapeSkye(keywords).then(products => {
    console.log(JSON.stringify(products, null, 2));
}).catch(error => {
    console.error("Error:", error);
});
