# # Use an official Node.js runtime as a parent image
# FROM node:20
# # Set the working directory in the container
# WORKDIR /usr/src/app
# # Copy package.json and package-lock.json to the working directory
# COPY package*.json ./
# # Install app dependencies
# RUN npm install
# # Bundle app source
# COPY . .
# # Expose the port your app runs on
# EXPOSE 5500
# # Define the command to run your app
# CMD [ "node", "index.js" ]
# Use an official Node.js runtime as a parent image
FROM node:20
# Set the working directory in the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install app dependencies
RUN npm install
# Install PM2 globally
RUN npm install pm2 -g
# Set PM2 environment variables with your keys
ENV PM2_PUBLIC_KEY=vsxx9d81o791g2n
ENV PM2_SECRET_KEY=o3uwh36udhakbso
# Copy app source code to the container
COPY . .
# Expose the port your app runs on
EXPOSE 5500
# Use PM2 to run the app with pm2-runtime for process management
CMD ["pm2-runtime", "index.js"]
