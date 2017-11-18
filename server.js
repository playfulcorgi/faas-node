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
// https://github.com/expressjs/express/issues/1291
// https://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
// https://github.com/baryshev/connect-domain/blob/master/lib/connect-domain.js
// https://github.com/nodejs/node/issues/10843
// https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/

const cluster = require('cluster')
const serverPort = +process.env.PORT || 80

if (cluster.isMaster) {
	console.log(`Forking a new server.`)
	cluster.fork()
	// cluster.fork() #fork can be added multiple times to spawn multiple workers if needed.
	// Maybe for development it's best to use just one fork, but many for production.
	cluster.on('disconnect', worker => {
    console.error(`Forked server disconnected, creating a new one as a replacement.`)
    cluster.fork()
  })
} else {
	// TODO: Change domain module to a better solution in the future (doesn't exist yet in Node world, see https://github.com/nodejs/node/issues/10843).
	const domain = require('domain')
	const connect = require('connect')
	const http = require('http')
	const app = connect()
	const bodyParser = require('body-parser')
	const morgan = require('morgan')
	const responseTime = require('response-time')
	const qs = require('qs')
	const url = require('url');
	const send = require('connect-send-json')
	const server = http.createServer(app)
	
	app.use((request, response, next) => {
		const d = domain.create()
		d.on('error', (domainError) => {
			console.error(`error ${domainError.stack}`)
			try {
				const killtimer = setTimeout(() => {
					console.error(`Server fork didn't close gracefully, trying to close server process.`)
					process.exit(1)
				}, 30000)
				killtimer.unref()// The timer won't block the main thread from exiting before completing.
				next(new Error(`Unhandled server error`))
				console.log(`Trying to close forked server gracefully.`)
				server.close()
				cluster.worker.disconnect()
			} catch (forkKillError) {
				console.error(`Error sending 500! The server fork is stuck and can't be closed gracefully (server.close()) or forcefully (process.exit(1)). ${forkKillError.stack}`)
			}
		})
	
		d.run(next)
	})
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
		require('/app/index.js').handler(request, response)
	})
	app.use((error, request, response, next) => {
		console.log('Error received.')
		response.statusCode = 500
		// TODO: The following response might not be the best for 500.
		response.setHeader('Content-Type', 'text/plain')
		response.json({message: `Unhandled error occurred.`})
	});
	
	server.on('close', () => {
		console.log(`Server is closing on port ${serverPort}.`)
	})
	process.on('SIGINT', function() {
		server.close(() => {
			console.log(`Server closed on port ${serverPort}.`)
		});
	});
	server.setTimeout(10000)// The server will stop any stuck or long request handlers.
	server.listen(serverPort, () => {
		console.log(`HTTP server listening on port ${serverPort}.`)
	})
}