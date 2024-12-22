const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const levenshtein = require('fast-levenshtein'); // Ensure it's installed: npm install fast-levenshtein

puppeteer.use(StealthPlugin());

async function scrapeSkye(keywords) {
    const baseURL = 'https://www.skye1204gaming.com';

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Go to the website
        await page.goto(baseURL, { waitUntil: 'networkidle2' });

        // Extract all menu items dynamically
        const menus = await page.evaluate(() => {
            const elements = document.querySelectorAll('.header__menu-item.list-menu__item.link.link--text.focus-inset, .menu-drawer__menu-item.list-menu__item.link.link--text.focus-inset');
            return Array.from(elements).map(el => ({
                name: el.innerText.trim(),
                link: el.getAttribute('href'),
            }));
        });

        // Find the closest match using Levenshtein distance
        let closestMatch = { name: '', link: '' };
        let minDistance = Infinity;

        menus.forEach(item => {
            const distance = levenshtein.get(keywords.toLowerCase(), item.name.toLowerCase());
            if (distance < minDistance) {
                minDistance = distance;
                closestMatch = item;
            }
        });

        // If no match is found, exit early
        if (!closestMatch.link) {
            console.log('No matching keyword found.');
            return [];
        }

        // Construct the URL for the matched category
        const URL = `${baseURL}${closestMatch.link}`;
        console.log(`Closest match: ${closestMatch.name} | Navigating to: ${URL}`);

        // Navigate to the closest match URL
        await page.goto(URL, { waitUntil: 'networkidle2' });

        // Extract product details
        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('.card-wrapper.product-card-wrapper');
            return Array.from(productElements).map(element => {
                const imgElement = element.querySelector('.media img');
                const nameElement = element.querySelector('.card__heading a');
                const priceElement = element.querySelector('.price__sale .price-item--sale');
                const oldPriceElement = element.querySelector('.price__regular .price-item--regular');

                return {
                    name: nameElement ? nameElement.textContent.trim() : '',
                    price: priceElement ? priceElement.textContent.trim() : '',
                    img_link: imgElement ? imgElement.getAttribute('src') : '',
                    product_link: nameElement ? nameElement.getAttribute('href') : '',
                    old_price: oldPriceElement ? oldPriceElement.textContent.trim() : null,
                };
            });
        });

        return products;
    } catch (error) {
        console.error("Error scraping Skye1204Gaming:", error);
        return [];
    } finally {
        await browser.close();
    }
}

// Get keywords from arguments or default to 'fate grand order'
const keywords = process.argv[2] || 'fate grand order';

// Execute the scraper
scrapeSkye(keywords).then(products => {
    console.log(JSON.stringify(products, null, 2));
}).catch(error => {
    console.error("Error:", error);
});
