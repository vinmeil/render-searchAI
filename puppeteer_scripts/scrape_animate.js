// const puppeteer = require('puppeteer');
import puppeteer from "puppeteer";

async function scrapeAnimate(keywords) {
    const URL = `https://www.animate.shop/search?type=product&q=${keywords}`;
    let browser;
    browser = await puppeteer.launch({
    args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
    ],
    executablePath:
        process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    headless: true,
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(URL, { waitUntil: 'networkidle2' });

    const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll(".product-item.product-item--vertical");
        const allProducts = [];

        productElements.forEach((product, index) => {
            if (index < 8) {
                // Extract product name
                const nameElement = product.querySelector(".product-item__title");
                const name = nameElement ? nameElement.innerText.trim() : "N/A";

                // Extract price
                const priceElement = product.querySelector(".money");
                let price = priceElement ? priceElement.innerText.trim() : "N/A";
                price = price.replace(' MYR', '');

                // Extract image link
                const imgElement = product.querySelector(".product-item__image-wrapper img");
                const imgLink = imgElement ? `https:${imgElement.getAttribute("src")}` : "N/A";

                // Extract product link
                const linkElement = product.querySelector(".product-item__title");
                const productLink = linkElement
                    ? `https://www.animate.shop${linkElement.getAttribute("href")}`
                    : "N/A";

                allProducts.push({
                    name: name,
                    price: price,
                    img_link: imgLink,
                    product_link: productLink,
                });
            }
        });

        return allProducts;
    });

    await browser.close();
    return products;
}

const keywords = process.argv[2] || "hololive"; // Default to 'hololive' if no keywords are provided
scrapeAnimate(keywords).then((products) => {
    console.log(JSON.stringify(products, null, 2));
}).catch((err) => {
    console.error("Error:", err);
});