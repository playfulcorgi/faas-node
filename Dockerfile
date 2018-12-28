FROM node:9.7.1
ENV HANDLER_FILE_SUBPATH="index.js"
ENV WATCH="true"
EXPOSE 8888
WORKDIR /logic
COPY * ./
RUN npm i
WORKDIR /app
ENTRYPOINT ["/logic/start"]