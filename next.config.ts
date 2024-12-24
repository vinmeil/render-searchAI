const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, "app/api/products/backend"),
              to: path.resolve(
                __dirname,
                ".next/server/app/api/products/backend"
              ),
            },
            {
              from: path.resolve(
                __dirname,
                "node_modules/puppeteer-extra-plugin-stealth/evasions"
              ),
              to: path.resolve(
                __dirname,
                ".next/server/node_modules/puppeteer-extra-plugin-stealth/evasions"
              ),
            },
          ],
        })
      );
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
