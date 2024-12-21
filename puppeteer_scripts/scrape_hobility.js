const puppeteer = require('puppeteer');

async function scrapeHobility(keywords) {
    const URL = `https://hobility.com/?ywcas=1&post_type=product&lang=en_US&s=${keywords}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll("a.woocommerce-LoopProduct-link"); // Select all product links
        const allProducts = [];

        productElements.forEach((product, index) => {
            if (index < 8) { // Limit to 8 products
                const nameElement = product.querySelector(".woocommerce-loop-product__title");
                const priceElement = product.querySelector(".woocommerce-Price-amount");
                const imgElement = product.querySelector("img");
                const linkElement = product.getAttribute("href");

                const name = nameElement ? nameElement.innerText.trim() : "N/A";

                // Fix price extraction
                const priceCurrency = priceElement
                    ? priceElement.querySelector(".woocommerce-Price-currencySymbol").innerText.trim()
                    : "";
                const priceAmount = priceElement
                    ? priceElement.querySelector("bdi").innerText.trim().replace(",", "") // Remove commas for standard numeric format
                    : "0";
                const price = `${priceCurrency}${priceAmount}`;

                const imgLink = imgElement ? imgElement.src : "N/A";
                const productLink = linkElement ? linkElement : "N/A";

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

const keywords = process.argv[2];
scrapeHobility(keywords).then(products => {
    console.log(JSON.stringify(products, null, 2));
}).catch(err => {
    console.error("Error:", err);
});
