const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeOhgatcha(keywords) {
    const URL = `https://ohgatcha.com/search?q=${keywords}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Wait for the product elements to load
    await page.waitForSelector(".product-wrap");

    try {
        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll(".product-wrap");
            const all_products = [];
            productElements.forEach((product, index) => {
                if (index < 8) {
                    const nameElement = product.querySelector(".hidden-product-link");                    
                    const priceElement = product.querySelector(".product-info__caption .product-details .price") ||
                                         product.querySelector(".product-details .current_price .money") || 
                                         product.querySelector(".money") ||
                                         product.querySelector("PLACEHOLDER COZ I DONT KNOW");
                    const imgElement = product.querySelector(".image-element__wrap img");
                    const linkElement = product.querySelector("a");

                    const name = nameElement ? nameElement.innerText.trim() : "N/A";
                    const price = priceElement ? priceElement.innerText.trim() : "N/A";
                    let imgLink = imgElement ? imgElement.src : "N/A";
                    const productLink = linkElement ? linkElement.href : "N/A";

                    // Check for lazy-loaded image
                    if (imgElement && imgElement.dataset.src) {
                        imgLink = imgElement.dataset.src;
                    }

                    all_products.push({
                        name: name,
                        price: price,
                        img_link: imgLink,
                        product_link: productLink
                    });
                }
            });
            return all_products;
        });

        // Print only the JSON output
        console.log(JSON.stringify(products));
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