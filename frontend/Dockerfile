# frontend/Dockerfile
# Use an official Node.js image for development
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the React app runs on
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]