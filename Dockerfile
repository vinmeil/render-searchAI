# Use an official Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Create and set permissions for the .next directory
RUN mkdir -p /app/.next && \
    chown -R node:node /app

# Ensure the .next directory has proper permissions
RUN chmod -R 755 /app/.next

# Switch to a non-root user
USER node

# Set environment variables
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2F1c2FsLWdvb3NlLTQ0LmNsZXJrLmFjY291bnRzLmRldiQ

# Build the application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
