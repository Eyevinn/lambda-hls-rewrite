const fastify = require("fastify");
const { handler } = require("./dist/index.js");

const server = fastify();
server.get("*", async (request, reply) => {
  //console.log(request.url);
  let params = {};
  const [ path, queryString ] = request.url.split("?");
  if(queryString) {
    for (let pair of queryString.split("&")) {
      const [k, v] = pair.split("=");
      params[k] = v;
    }
  }
  const event = {
    requestContext: {
      elb: {}
    },
    path: path,
    httpMethod: request.method,
    headers: request.headers,
    queryStringParameters: params,
  };
  const response = await handler(event);
  reply
  .code(response.statusCode)
  .headers(response.headers)
  .send(response.body);
});

server.listen(process.env.PORT || 8000, "0.0.0.0", (err, address) => {
  console.log(`Server listening at ${address}`);
});
