FROM ghcr.io/puppeteer/puppeteer:23.10.4

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# Ensure the correct environment variables are set
ENV NODE_ENV=production

# Set the correct permissions for the .next directory
RUN mkdir -p /app/.next && chmod -R 777 /app/.next

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]