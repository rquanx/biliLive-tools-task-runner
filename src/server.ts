import Fastify from 'fastify'
import dotenv from 'dotenv'
import { logger } from './logger'
import { testRoute } from './routes/test'
import { deleteRoute } from './routes/delete'

dotenv.config()

const app = Fastify({ logger: false })
const port = Number(process.env.PORT || 15225)
const host = process.env.HOST || '0.0.0.0'
const authHeader = process.env.AUTH_HEADER || 'Authorization'
const authSecret = process.env.AUTH_SECRET || ''

app.addHook('preHandler', async (request, reply) => {
  const isPublic = request.url.startsWith('/del/continue')
  const headerValue = request.headers[authHeader.toLowerCase()] || request.headers[authHeader]
  const authorized = typeof headerValue === 'string' && headerValue === authSecret
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers: request.headers,
    query: request.query,
    // !! desc 会是多行数据，可能无法处理
    body: request.body,
    auth: isPublic ? 'skip' : authorized ? 'ok' : 'fail',
    step: 'preHandler',
  }
  logger.info(logEntry)
  if (!isPublic && !authorized) {
    return reply.code(401).send({ ok: false, error: 'Unauthorized' })
  }
})

app.register(testRoute)
app.register(deleteRoute)

app
  .listen({ port, host })
  .then(() => {
    console.log(`Server listening on ${host}:${port}`)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
