const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://myanimelist.net/topanime.php?type=bypopularity');

  const animeNames = [];

  while (true) {
    // Scrape the names of animes on the current page
    const names = await page.evaluate(() => {
      const names = [];
      document.querySelectorAll('.ranking-list .title a').forEach((element) => {
        names.push(element.textContent.trim());
      });
      return names;
    });

    animeNames.push(...names);

    // Check if there is a "Next 50" button and click it
    const nextPageLink = await page.evaluate(() => {
      const nextPageElement = document.querySelector('.icon-top-ranking-page a.next');
      return nextPageElement ? nextPageElement.href : null;
    });

    if (nextPageLink) {
      await page.goto(nextPageLink);
    } else {
      break;
    }
  }

  // Convert the names to TXT format
  const txtContent = animeNames.join('\n');

  // Save the TXT file
  const filePath = path.join(__dirname, 'Xanime_names.txt');
  fs.writeFileSync(filePath, txtContent);

  console.log(`All anime names saved to ${filePath}`);

  await browser.close();
})();



// -----------------------------------------------------------------------------
// ---- Fallback Code in case the above code doesn't work ----
// -----------------------------------------------------------------------------

// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const path = require('path');

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('https://myanimelist.net/topanime.php?type=bypopularity');

//   const animeNames = [];

//   while (true) {
//     // Scrape the names of animes on the current page
//     const names = await page.evaluate(() => {
//       const names = [];
//       document.querySelectorAll('.ranking-list .title a').forEach((element) => {
//         names.push(element.textContent.trim());
//       });
//       return names;
//     });

//     animeNames.push(...names);

//     // Check if there is a "Next 50" button and click it
//     const nextPageLink = await page.evaluate(() => {
//       const nextPageElement = document.querySelector('.icon-top-ranking-page a.next');
//       return nextPageElement ? nextPageElement.href : null;
//     });

//     if (nextPageLink) {
//       await page.goto(nextPageLink);
//     } else {
//       break;
//     }
//   }

//   // Convert the names to TXT format
//   const txtContent = animeNames.join('\n');

//   // Save the TXT file
//   const filePath = path.join(__dirname, 'Xanime_names.txt');
//   fs.writeFileSync(filePath, txtContent);

//   console.log(`All anime names saved to ${filePath}`);

//   await browser.close();
// })();