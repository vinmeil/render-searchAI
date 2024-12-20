const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { writeFile, readFile } = require('fs/promises');
puppeteer.use(StealthPlugin());

async function scrapeOhgatcha(keywords) {
    const URL = `https://ohgatcha.com/search?q=${keywords}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Wait for the product elements to load
    await page.waitForSelector(".product-wrap");

    try {
        const html = await page.content();
        await writeFile('ogatcha.txt', html, 'utf-8');

        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll(".product-wrap");
            const all_products = [];
            productElements.forEach((product, index) => {
                if (index < 8) {
                    const nameElement = product.querySelector(".hidden-product-link"); 
                    const imgElement = product.querySelector(".image-element__wrap img");
                    const linkElement = product.querySelector("a");

                    const name = nameElement ? nameElement.innerText.trim() : "N/A";
                    let imgLink = imgElement ? imgElement.src : "N/A";
                    const productLink = linkElement ? linkElement.href : "N/A";

                    // Check for lazy-loaded image
                    if (imgElement && imgElement.dataset.src) {
                        imgLink = imgElement.dataset.src;
                    }

                    all_products.push({
                        name: name,
                        price: "N/A", // Placeholder for price
                        img_link: imgLink,
                        product_link: productLink
                    });
                }
            });
            return all_products;
        });

        const htmlContent = await readFile('ogatcha.txt', 'utf-8');
        const priceMatches = htmlContent.match(/<span class="money">\s*RM([\d.]+)\s*<\/span>/g);

        if (priceMatches) {
            const prices = priceMatches.map(match => {
                const priceMatch = match.match(/RM([\d.]+)/);
                return priceMatch ? `RM${priceMatch[1]}` : 'N/A';
            }).filter(price => price !== 'RM0.00'); // Filter out 'RM0.00'

            products.forEach((product, index) => {
                if (index < prices.length) {
                    product.price = prices[index];
                }
            });
        }

        return products;
    } catch (error) {
        console.error("Error scraping Ohgatcha:", error);
        return [];
    } finally {
        await browser.close();
    }
}

const keywords = process.argv[2];
scrapeOhgatcha(keywords).then(products => {
    // Print only the JSON output
    console.log(JSON.stringify(products));
}).catch(error => {
    console.error("Error:", error);
});