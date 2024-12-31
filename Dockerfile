FROM ghcr.io/puppeteer/puppeteer:23.11.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# Build the frontend
RUN npm run build

# Expose the port for the frontend
EXPOSE 3000

# Start both the frontend and backend
CMD ["sh", "-c", "npm run backend & npm run start"]