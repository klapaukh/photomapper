FROM node:argon

# Create a space for the application
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# NPM install required files
COPY package.json /usr/src/app
RUN NPM INSTALL

# Add application source
COPY . /usr/src/app

# Make port 3000 visible externally
EXPOSE 3000

# Run the application
CMD ["npm", "start"]

