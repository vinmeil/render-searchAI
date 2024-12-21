const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { writeFile, readFile } = require('fs/promises');
puppeteer.use(StealthPlugin());

async function scrapeSkye(keywords) {
    // Convert the keywords into a search URL
    const formattedKeywords = encodeURIComponent(keywords.toLowerCase().replace(/\s+/g, '-'));
    const URL = `https://www.skye1204gaming.com/collections/${formattedKeywords}`;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    try {
        // Wait for the product cards to load
        await page.waitForSelector('.card-wrapper.product-card-wrapper');
        
        // Extract product data using querySelector
        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('.card-wrapper.product-card-wrapper');
            const productData = [];

            productElements.forEach((element) => {
                const imgElement = element.querySelector('.media img');
                const nameElement = element.querySelector('.card__heading a');
                const priceElement = element.querySelector('.price__sale .price-item--sale');
                const oldPriceElement = element.querySelector('.price__regular .price-item--regular');

                const imgLink = imgElement ? imgElement.getAttribute('src') : '';
                const productName = nameElement ? nameElement.textContent.trim() : '';
                const productLink = nameElement ? `https://www.skye1204gaming.com${nameElement.getAttribute('href')}` : '';
                const price = priceElement ? priceElement.textContent.trim() : '';
                const oldPrice = oldPriceElement ? oldPriceElement.textContent.trim() : '';

                if (productName && price) {
                    productData.push({
                        name: productName,
                        price: price,
                        img_link: imgLink,
                        product_link: productLink,
                        old_price: oldPrice || null,  // If old price exists, store it
                    });
                }
            });

            return productData;
        });

        return products;
    } catch (error) {
        console.error("Error scraping Skye1204Gaming:", error);
        return [];
    } finally {
        await browser.close();
    }
}

const keywords = process.argv[2] || 'fate grand order';
scrapeSkye(keywords).then(products => {
    console.log(JSON.stringify(products, null, 2));
}).catch(error => {
    console.error("Error:", error);
});
