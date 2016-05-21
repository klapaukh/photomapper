FROM node:wheezy

# Create a space for the application
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# NPM install required files
COPY package.json ./
RUN npm install

# Add application source
COPY app.js ./ 
COPY bin/ ./bin/ 
COPY routes/ ./routes/
COPY views/ ./views/
COPY public/stylesheets ./public/stylesheets/
COPY public/javascripts ./public/javascripts/

# Add a directory for the images
RUN mkdir -p ./public/images

# We assume /opt/tagged and /opt/manuallyPlaced have
# been mouted from the file system
RUN ln -s /opt/geotagged /usr/src/app/public/images/geotagged
RUN ln -s /opt/manuallyPlaced /usr/src/app/public/images/manuallyPlaced

# Make port 3000 visible externally
EXPOSE 3000

# Run the application
CMD ["npm", "start"]

