import puppeteer from "puppeteer-extra";

async function scrapeOhgatcha(keywords) {
    const URL = `https://ohgatcha.com/search?q=${keywords}`;
    let browser;
    browser = await puppeteer.launch({
        args: ["--disable-setuid-sandbox", "--no-sandbox", "--no-zygote"],
        executablePath:
            process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
        headless: true,
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(URL, { waitUntil: "networkidle2" });

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

                if (imgElement && imgElement.dataset.src) {
                    imgLink = imgElement.dataset.src;
                }

                all_products.push({
                    name,
                    price: "SOLD OUT",
                    img_link: imgLink,
                    product_link: productLink,
                });
            }
        });
        return all_products;
    });

    await browser.close();
    return products;
}

const keywords = process.argv[2] || "hololive";
scrapeOhgatcha(keywords).then(products => {
  console.log(JSON.stringify(products, null, 2));
}).catch(err => {
  console.error("Error:", err);
});