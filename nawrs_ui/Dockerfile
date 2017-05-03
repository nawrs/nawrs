# This image will be based on the official nodejs docker image
FROM node:latest

# Specify from which directory commands will run
WORKDIR ./nawrsapp

# Put all our code inside that directory that lives in the container
ADD package.json bower.json /nawrsapp/

RUN apt-get update
RUN npm install -g bower
RUN npm install
RUN bower install --config.interactive=false --allow-root

# Tell Docker we are going to use these ports
EXPOSE 8000
