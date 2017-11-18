FROM node:9

# ADD https://github.com/openfaas/faas/releases/download/0.6.10/fwatchdog /usr/bin
# RUN chmod +x /usr/bin/fwatchdog
# WORKDIR /app
# COPY index.js .
# COPY package.json .
# ENV fprocess="node index.js"
# EXPOSE 8080
# RUN npm i
# CMD ["fwatchdog"]

WORKDIR /requestHandler
COPY package.json .
COPY server.js .
EXPOSE 80
CMD [ "node", "./server"]