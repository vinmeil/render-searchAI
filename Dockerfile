# Use Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire application code to the container
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Compile TypeScript to JavaScript
RUN npx tsc --project tsconfig.json

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
