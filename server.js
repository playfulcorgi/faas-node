// https://github.com/awslabs/aws-serverless-express/blob/master/index.js
// https://expressjs.com/en/resources/middleware/timeout.html
// https://github.com/atlantanodejs/site-app/wiki/Connect-vs-Express
// https://github.com/senchalabs/connect
// https://www.npmjs.com/package/connect-timeout
// https://www.npmjs.com/package/response-time
// https://www.npmjs.com/package/cookie-parser
// https://www.npmjs.com/package/body-parser
// https://github.com/openfaas/faas/blob/master/sample-functions/NodeInfo/main.js
// https://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-express-js-on-node-js
// https://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-express-js-on-node-js
// https://www.npmjs.com/package/qs

const connect = require('connect')
const http = require('http')
const app = connect()
const bodyParser = require('body-parser')
const serverPort = 80
const morgan = require('morgan')
const responseTime = require('response-time')
const qs = require('qs')
const url = require('url');
const send = require('connect-send-json')

app.use(responseTime())
app.use(morgan('combined'))
// Maybe I'm using too many parsers (bodyParser). Maybe parsing a request should be up to the handler instead to save resources, so the handler would only parse what he needs.
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(bodyParser.raw())
app.use(bodyParser.text())
app.use(send.json())
// TODO: replace console.log with logging to a better logger.
app.use((request, response) => {
	const urlParts = url.parse(request.url, true)
	request.query = urlParts.query
	response.setHeader('Content-Type', 'text/plain')
	// console.log(request.query)
	// response.end('Hello from Connect!\n')
	// response.json({
	// 	someKey: 'someValue of key'
	// })
})
const server = http.createServer(app)
server.setTimeout(10000)// The server will stop any stuck or long request handlers.
server.listen(serverPort)