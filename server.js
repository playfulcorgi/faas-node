/* eslint-disable global-require */
require('source-map-support').install()
const cluster = require('cluster')
const serverPort = 80

if (cluster.isMaster) {
  console.log(`Forking a new server.`)
  cluster.fork()
  cluster.on('disconnect', worker => {
    if (!worker.exitedAfterDisconnect) {
      console.error(`Forked server disconnected unexpectedly, creating a new one as a replacement.`)
      cluster.fork()
    } else {
      console.log('Forked server disconnected but it was expected. Not creating a replacement.')
    }
  })

  const clusterClose = () => {
    Object.keys(cluster.workers).forEach(workerId => cluster.workers[workerId].kill())
  }

  const onSIGINT = clusterClose

  process.on('SIGINT', onSIGINT)
} else {
  // FIXME: Change domain module to a better solution in the future (doesn't
  // exist yet in Node world, see https://github.com/nodejs/node/issues/10843).
  const domain = require('domain')
  const connect = require('connect')
  const http = require('http')
  const app = connect()
  const bodyParser = require('body-parser')
  const morgan = require('morgan')
  const responseTime = require('response-time')
  const qs = require('qs')
  const url = require('url')
  const send = require('connect-send-json')
  const server = http.createServer(app)
  const serializeError = require('serialize-error')
  const { resolve } = require('path')

  process.chdir('/app')

  app.use((request, response, next) => {
    const domainInstance = domain.create()
    domainInstance.on('error', (domainError) => {
      console.error(`error ${domainError.stack}`)
      try {
        const killtimer = setTimeout(() => {
          console.error(`Server fork didn't close gracefully, trying to close server process.`)
          process.exit(1)
        }, 30000)
        // With killtimer.unref() the timer won't block the main thread from
        // exiting before completing.
        killtimer.unref()
        next(new Error(`Unhandled server error`))
        console.log(`Trying to close forked server gracefully.`)
        server.close()
        cluster.worker.disconnect()
      } catch (forkKillError) {
        console.error(`Error sending 500! The server fork is stuck and can't be closed gracefully (server.close()) or forcefully (process.exit(1)). ${forkKillError.stack}`)
      }
    })

    domainInstance.run(next)
  })
  app.use(responseTime((request, response, time) => {
    // FIXME: For an unknown reason, time of first request is always recorded as
    // about 10 seconds.
    console.log(`Response time was ${Math.floor(time)}ms.`)
  }))
  app.use(morgan('combined'))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(bodyParser.raw())
  app.use(bodyParser.text())
  app.use(send.json())
  app.use((request, response) => {
    const urlParts = url.parse(request.url, true)
    request.query = urlParts.query
    response.setHeader('Content-Type', 'text/plain')
    const handlerPath = resolve('/app', process.env.HANDLER_FILE_SUBPATH)
    // eslint-disable-next-line import/no-dynamic-require
    require(handlerPath)(request, response)
  })
  app.use((error, request, response, next) => {
    console.log('Error received.')
    response.statusCode = 500
    response.json({
      message: 'Error trying to handle request.',
      error: serializeError(error)
    })
  })

  server.on('close', () => {
    console.log(`Server is closing on port ${serverPort}.`)
  })
  // The server will stop any stuck or long request handlers.
  server.setTimeout(10000)
  server.listen(serverPort, () => {
    console.log(`HTTP server internally listening on port ${serverPort}. Request timeout is ${10}s.`)
  })

  const serverClose = () => {
    server.close(() => {
      console.log(`Server closed on port ${serverPort}.`)
    })
  }

  const onSIGINT = serverClose

  process.on('SIGINT', onSIGINT)
}
