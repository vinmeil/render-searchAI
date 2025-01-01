# Use the Puppeteer image as the base image
FROM ghcr.io/puppeteer/puppeteer:23.10.4

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for caching dependencies
COPY package*.json ./ 

# Install dependencies
RUN npm ci

# Copy all application files
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Compile TypeScript files to JavaScript
RUN npx tsc --project tsconfig.json

# Create and set permissions for the .next directory
RUN mkdir -p /app/.next && \
    chown -R node:node /app

# Ensure the .next directory has proper permissions
RUN chmod -R 755 /app/.next

# Switch to a non-root user for security
USER node

# Set environment variables dynamically
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Build the Next.js application
RUN npm run build

# Expose the port for container
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
