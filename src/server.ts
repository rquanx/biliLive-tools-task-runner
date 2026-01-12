import Fastify from 'fastify';
import dotenv from 'dotenv';
import { logger } from './logger';
import { testRoute } from './routes/test';

dotenv.config();

const app = Fastify({ logger: false });
const port = Number(process.env.PORT || 15225);
const authHeader = process.env.AUTH_HEADER || 'Authorization';
const authSecret = process.env.AUTH_SECRET || '';

app.addHook('onRequest', async (request, reply) => {
  const headerValue = request.headers[authHeader.toLowerCase()] || request.headers[authHeader];
  const authorized = typeof headerValue === 'string' && headerValue === authSecret;
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers: request.headers,
    query: request.query,
    body: request.body,
    auth: authorized ? 'ok' : 'fail'
  };
  logger.info(logEntry);
  if (!authorized) {
    return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  }
});

app.register(testRoute);

app.listen({ port }).then(() => {
  console.log(`Server listening on ${port}`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
