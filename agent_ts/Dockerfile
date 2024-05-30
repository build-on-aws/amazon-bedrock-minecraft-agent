# Use the official Node.js image as the base image
FROM node:18-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port that your application listens on
EXPOSE 25565

# Set the command to start your application
CMD ["npm", "start:dev"]