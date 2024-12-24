const { join } = require("path");

/**
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  executablePath: "/opt/bin/chromium",
  cacheDirectory: join(__dirname, "node_modules", ".puppeteer_cache"),
};
