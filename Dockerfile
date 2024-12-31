# Use an official Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
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

# Set environment variables dynamically for production
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Build the Next.js application
# RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD ["npm", "run", "dev"]