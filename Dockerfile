# Use the Puppeteer image as the base image
FROM ghcr.io/puppeteer/puppeteer:23.10.4

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for caching dependencies
COPY package*.json ./ 

# Install dependencies
RUN npm ci

# Copy all application files
COPY . .

# Temporarily switch to root user to install TypeScript globally
USER root
RUN npm install -g typescript

# Compile TypeScript files to JavaScript
RUN npx tsc --project tsconfig.json

# Create and set permissions for the .next directory
RUN mkdir -p /app/.next && \
    chmod -R 755 /app/.next

# Ensure the entire /app directory has proper permissions
RUN chmod -R 755 /app

# # Switch back to non-root user
# USER pptruser

# Set environment variables dynamically
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Build the Next.js application
RUN npm run build

# Expose the port for container
EXPOSE 3000

# Switch back to non-root user
USER pptruser

# Start the application
CMD ["npm", "start"]
