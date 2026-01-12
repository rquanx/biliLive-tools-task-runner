import { FastifyInstance } from 'fastify';

export async function testRoute(app: FastifyInstance) {
  app.all('/test', async (request, reply) => {
    return reply.code(200).send({ ok: true, method: request.method, url: request.url });
  });
}
