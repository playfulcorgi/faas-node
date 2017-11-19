FROM node:9.2.0

WORKDIR /requestHandler
COPY package.json .
COPY package-lock.json .
RUN npm i
COPY server.js .
EXPOSE 80
WORKDIR /app
COPY "default-index.js" "index.js"
WORKDIR /app
ENTRYPOINT node /requestHandler/server