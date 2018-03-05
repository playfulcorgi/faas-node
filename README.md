# playfulcorgi/faas-node

playfulcorgi/faas-node (FN) is a Docker image that simulates a [FaaS][2] environment. It runs a tiny [Connect][1] server to accept HTTP (not HTTPS) requests and relays them to a handler file written in JavaScript.

## Default Environment Variables Used By FN

|Key|Description|Default Value|Example of custom value|
|-|-|-|-|
|`HANDLER_FILE_SUBPATH`|To change which file is used as the handler, provide a different value for this key. If a relative path to a handler file is provided for this key, it will start at /app. **Important: the working directory for the handler is always /app by default and there is no default handler provided by the image.**|`"index.js"`|[example](#handlerPathExample)|
|`WATCH`|If this key's value is set to `"true"`, [nodemon][3] will watch the directory containing `HANDLER_FILE_SUBPATH`. This is a convenience setting that makes developing handlers easier. For example, if a handler is built from source files by using [Webpack][4], nodemon can detect whenever the handler is updated and restart the FaaS.|`"true"`|[example](#watchExample)|

## package.json Scripts
|Script|Description|
|-|-|
|`docker-build`|Builds the Docker image.|

## Custom Handler Example<a name="handlerPathExample"></a>

### Handler

There is no default handler provided by the image. The image won't work without a handler provided. The handler needs to export a function using Node's CommonJS format that has the same signature as a Connect endpoint handler, for example:

```js
// This is a sample handler.
module.exports = (request, response) => {
  response.json({
    message: 'This is a sample response.'
  })
}
```

The handler needs to be compatible with Node >= 9.7.1 ([Babel][5] is not supported but can be use to generate the handler beforehand).

### Running

```bash
docker run --name my-faas -v /my-faas-sources:/app -p 80:80 -e HANDLER_FILE_SUBPATH="dist/main.js" playfulcorgi/faas-node
```

Changing `HANDLER_FILE_SUBPATH` can be useful when source files are transpiled (ie. by Webpack or Gulp), before being used by the FaaS server. The transpiler will generate the /app/dist/main.js file.

## Watch Example<a name="watchExample"></a>

```bash
docker run --name my-faas -v /my-faas-sources:/app -p 80:80 -e WATCH=false playfulcorgi/faas-node
```

In production, it may be a better to stop watching the handler's directory.

## Example Docker Image Using FN As Base

This image will run `npm run watch` inside /app to generate dist/index.js and tell FN to watch dist for changes. FN calls the command provided as CMD in Docker in the background while running the FaaS server in the foreground.

```dockerfile
FROM playfulcorgi/faas-node
COPY . ./
RUN npm i
ENV HANDLER_FILE_SUBPATH="dist/index.js"
CMD ["npm", "run", "watch"]
```

[1]: https://github.com/senchalabs/connect
[2]: https://en.wikipedia.org/wiki/Function_as_a_service
[3]: https://github.com/remy/nodemon/
[4]: https://webpack.js.org/
[5]: https://babeljs.io/

<!-- 
References:
https://github.com/awslabs/aws-serverless-express/blob/master/index.js
https://expressjs.com/en/resources/middleware/timeout.html
https://github.com/atlantanodejs/site-app/wiki/Connect-vs-Express
https://github.com/senchalabs/connect
https://www.npmjs.com/package/connect-timeout
https://www.npmjs.com/package/response-time
https://www.npmjs.com/package/cookie-parser
https://www.npmjs.com/package/body-parser
https://github.com/openfaas/faas/blob/master/sample-functions/NodeInfo/main.js
https://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-express-js-on-node-js
https://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-express-js-on-node-js
https://www.npmjs.com/package/qs
https://github.com/expressjs/express/issues/1291
https://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
https://github.com/baryshev/connect-domain/blob/master/lib/connect-domain.js
https://github.com/nodejs/node/issues/10843
https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/
-->