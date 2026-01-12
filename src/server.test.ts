import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import Fastify from 'fastify'
import { testRoute } from './routes/test'
import TestAgent from 'supertest/lib/agent'

const AUTH_SECRET = 'test-secret'

const buildApp = async () => {
  const app = Fastify()
  const authHeader = 'Authorization'
  app.addHook('onRequest', async (request, reply) => {
    const authorized = request.headers[authHeader.toLowerCase()] === AUTH_SECRET
    if (!authorized) {
      return reply.code(401).send({ ok: false, error: 'Unauthorized' })
    }
  })
  await app.register(testRoute)
  await app.ready()
  return app
}

describe('/test route', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  let request: TestAgent

  beforeAll(async () => {
    app = await buildApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns 401 without auth', async () => {
    const res = await request.get('/test')
    expect(res.status).toBe(401)
  })

  it('returns ok with auth and echoes', async () => {
    const res = await request.post('/test?foo=bar').set('Authorization', AUTH_SECRET).send({ a: 1 })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, method: 'POST', url: '/test?foo=bar' })
  })
})
