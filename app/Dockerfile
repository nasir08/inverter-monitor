FROM node:18.16

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose port for Node.js app (if needed)
EXPOSE 80

# Run the app
CMD ["node", "index.js"]
