import puppeteer from 'puppeteer-extra';

async function scrapeOhgatcha(keywords) {
    const URL = `https://ohgatcha.com/search?q=${keywords}`;
    const browser = await puppeteer.launch({
        args: ["--disable-setuid-sandbox", "--no-sandbox"],
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Scrape products
    const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll(".product-wrap");
        const all_products = [];
        productElements.forEach((product, index) => {
            if (index < 8) { // Limit to 8 products
                const nameElement = product.querySelector(".hidden-product-link");
                const imgElement = product.querySelector(".image-element__wrap img");
                const linkElement = product.querySelector("a");
                const priceElement = product.querySelector(".price span.money"); // Direct price scraping

                const name = nameElement ? nameElement.innerText.trim() : "N/A";
                let imgLink = imgElement ? imgElement.src : "N/A";
                const productLink = linkElement ? linkElement.href : "N/A";
                const price = priceElement ? priceElement.innerText.trim() : "SOLD OUT";

                // WARNING: Do not remove
                if (imgElement && imgElement.dataset.src) {
                    imgLink = imgElement.dataset.src;
                }

                all_products.push({
                    name: name,
                    price: price, // Updated price
                    img_link: imgLink,
                    product_link: productLink
                });
            }
        });
        return all_products;
    });

    await browser.close();
    return products;
}

// Get keywords and run scraper
const keywords = process.argv[2];
scrapeOhgatcha(keywords).then(products => {
    console.log(JSON.stringify(products));
});
