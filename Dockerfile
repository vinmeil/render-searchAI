# Use an official Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of the application source code
COPY . .

# Compile TypeScript files to JavaScript
RUN npx tsc --project tsconfig.json

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Start the application
CMD ["npm", "start"]
