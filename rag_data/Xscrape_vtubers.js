const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://virtualyoutuber.fandom.com/wiki/Special:AllPages');

  const vtuberNames = [];

  while (true) {
    // Scrape the names of VTubers on the current page
    const names = await page.evaluate(() => {
      const names = [];
      document.querySelectorAll('.mw-allpages-chunk li a').forEach((element) => {
        names.push(element.textContent.trim());
      });
      return names;
    });

    vtuberNames.push(...names);

    // Check if there is a "Next page" button and click it
    const nextPageLink = await page.evaluate(() => {
      const nextPageElement = document.querySelector('.mw-allpages-nav a[title^="Special:AllPages"]:last-child');
      return nextPageElement && nextPageElement.innerText.includes('Next page') ? nextPageElement.href : null;
    });

    if (nextPageLink) {
      await page.goto(nextPageLink);
    } else {
      break;
    }
  }

  // Convert the names to TXT format
  const txtContent = vtuberNames.join('\n');

  // Save the TXT file
  const filePath = path.join(__dirname, 'Xvtuber_names.txt');
  fs.writeFileSync(filePath, txtContent);

  console.log(`All VTuber names saved to ${filePath}`);

  await browser.close();
})();