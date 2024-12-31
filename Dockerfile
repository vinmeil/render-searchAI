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

# Install TypeScript globally
RUN npm install -g typescript

# Compile TypeScript files to JavaScript
RUN npx tsc --project tsconfig.json

# Build the Next.js application
# RUN npm run build

# Expose port 3000 for Vercel
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
