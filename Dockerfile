# Use Node.js LTS as the base image
FROM node:16

# Set working directory
WORKDIR /server

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the app source code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Define the start command
CMD ["node", "server.js"]
