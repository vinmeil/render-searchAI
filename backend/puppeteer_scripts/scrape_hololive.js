const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { writeFile, readFile } = require('fs/promises');
puppeteer.use(StealthPlugin());

async function scrapeHololivePro(keywords) {
    const URL = `https://shop.hololivepro.com/en/search?q=${encodeURIComponent(keywords)}&options%5Bprefix%5D=last&sort_by=created-descending`;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    try {
        // Wait for the product grid container or a similar selector to ensure content is loaded
        await page.waitForSelector('.product-grid-container');

        // Save HTML content to a file for debugging and further processing
        const html = await page.content();
        await writeFile('hololive.txt', html, 'utf-8');

        // Extract image URLs using DOM and save placeholder values
        const products = await page.evaluate(() => {
            const imgElements = document.querySelectorAll('.primary-image');
            const limitedProducts = [];
            imgElements.forEach((img, index) => {
                if (index < 8) {
                    limitedProducts.push({
                        name: "N/A",
                        price: "N/A",
                        img_link: img.src || "N/A",
                        product_link: "N/A"
                    });
                }
            });
            return limitedProducts;
        });

        // Read the saved HTML file
        const htmlContent = await readFile('hololive.txt', 'utf-8');

        // Regex to extract products
        const productMatches = [...htmlContent.matchAll(/"price":{"amount":([\d.]+),"currencyCode":"MYR"}.*?"title":"([^"]+)".*?"url":"(\\\/en\\\/products\\\/[^"]+)".*?"image":{"src":"([^"]+)"/g)];

        for (let i = 0; i < products.length && i < productMatches.length; i++) {
            const match = productMatches[i];
            const price = match[1] ? `RM${match[1].trim()}` : "N/A";
            const title = match[2] ? match[2].trim() : "N/A";
            const relativeUrl = match[3] ? match[3].replace(/\\\//g, '/') : "";
            const productLink = relativeUrl ? `https://shop.hololivepro.com${relativeUrl}` : "N/A";
            const imgLink = match[4] ? match[4].replace(/\\\//g, '/') : "N/A";

            products[i].name = title;
            products[i].price = price;
            products[i].product_link = productLink;
            products[i].img_link = imgLink;
        }

        return products;
    } catch (error) {
        console.error("Error scraping HololivePro:", error);
        return [];
    } finally {
        await browser.close();
    }
}

const keywords = process.argv[2] || 'pekora';
scrapeHololivePro(keywords).then(products => {
    console.log(JSON.stringify(products));
}).catch(error => {
    console.error("Error:", error);
});