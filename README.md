This is a Docker image that simulates a [FaaS][2] environment for Node. It runs a [Connect][1] server to accept HTTP requests and relays them to a custom handler file for the specific FaaS function defined under /app/handler.js.

[1]: https://github.com/senchalabs/connect
[2]: https://en.wikipedia.org/wiki/Function_as_a_service