const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.skye1204gaming.com/');

  const gatchaNames = [];

  // Scrape the names of gatcha games on the current page
  const names = await page.evaluate(() => {
    const names = [];
    document.querySelectorAll('.list-menu .header__menu-item span').forEach((element) => {
      const name = element.textContent.trim();
      if (name !== 'All Products' && name !== 'Contact') {
        names.push(name);
      }
    });
    return names;
  });

  gatchaNames.push(...names);

  // Convert the names to TXT format
  const txtContent = gatchaNames.join('\n');

  // Save the TXT file
  const filePath = path.join(__dirname, 'Xgatcha_names.txt');
  fs.writeFileSync(filePath, txtContent);

  console.log(`All gatcha game names saved to ${filePath}`);

  await browser.close();
})();