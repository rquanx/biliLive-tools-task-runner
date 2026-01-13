/// <reference types="vitest" />

import Fastify, { FastifyInstance } from 'fastify'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCanDelete, pauseDelete, resumeDelete } from '../src/memory/delete-state'
import { deleteRoute } from '../src/routes/delete'
import * as utils from '../src/utils'

const sendServerChanMock = vi.hoisted(() => vi.fn())

vi.mock('../src/logger', () => {
  const noop = vi.fn()
  return { logger: { info: noop, warn: noop, error: noop } }
})

vi.mock('../src/notify/server-chan', () => ({
  sendServerChan: sendServerChanMock,
}))

vi.mock('../src/utils', async () => {
  const actual = await vi.importActual<typeof import('../src/utils')>('../src/utils')
  return { ...actual, delay: vi.fn().mockResolvedValue(undefined) }
})

const AUTH_HEADER = 'Authorization'
const AUTH_SECRET = 'dev-secret'
const originalEnv = { AUTH_HEADER: process.env.AUTH_HEADER, AUTH_SECRET: process.env.AUTH_SECRET }
const tempDirs: string[] = []

async function buildApp() {
  const app = Fastify({ logger: false })
  const authHeader = process.env.AUTH_HEADER || 'Authorization'
  const authSecret = process.env.AUTH_SECRET || ''

  app.addHook('preHandler', async (request, reply) => {
    const isPublic = request.url.startsWith('/del/continue')
    const headerValue =
      (request.headers as Record<string, string | undefined>)[authHeader.toLowerCase()] ||
      (request.headers as Record<string, string | undefined>)[authHeader]

    const authorized = typeof headerValue === 'string' && headerValue === authSecret
    if (!isPublic && !authorized) {
      return reply.code(401).send({ ok: false, error: 'Unauthorized' })
    }
  })

  await app.register(deleteRoute)
  await app.ready()
  return app
}

async function withApp(run: (app: FastifyInstance) => Promise<void>) {
  const app = await buildApp()
  try {
    await run(app)
  } finally {
    await app.close()
  }
}

async function createTempFile(fileName: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'delete-tests-'))
  tempDirs.push(dir)
  const filePath = path.join(dir, fileName)
  await fs.writeFile(filePath, 'content')
  return { dir, filePath }
}

beforeAll(() => {
  process.env.AUTH_HEADER = AUTH_HEADER
  process.env.AUTH_SECRET = AUTH_SECRET
})

afterAll(async () => {
  process.env.AUTH_HEADER = originalEnv.AUTH_HEADER
  process.env.AUTH_SECRET = originalEnv.AUTH_SECRET
  for (const dir of tempDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  resumeDelete()
})

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

describe('/del routes', () => {
  it('rejects requests without valid auth header', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        payload: { title: '成功:同步任务:a.mp4', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ ok: false, error: 'Unauthorized' })
    })
  })

  it('resumes deletion via /del/continue without auth', async () => {
    pauseDelete()

    await withApp(async (app) => {
      const response = await app.inject({ method: 'POST', url: '/del/continue' })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, canDelete: true })
      expect(getCanDelete()).toBe(true)
      expect(sendServerChanMock).toHaveBeenCalledWith('删除功能启用')
    })
  })

  it('validates required body fields', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ ok: false, error: 'title and dir are required' })
    })
  })

  it('skips when deletion is paused', async () => {
    pauseDelete()

    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:同步任务:a.mp4', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, skipped: 'delete-paused' })
      expect(sendServerChanMock).toHaveBeenCalledWith('删除任务暂停中')
    })
  })

  it('skips unparseable titles', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: 'bad-format', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, skipped: 'bad-title' })
    })
  })

  it('pauses deletion on failed tasks', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '失败:同步任务:a.mp4', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, paused: true })
      expect(getCanDelete()).toBe(false)
      expect(sendServerChanMock).toHaveBeenCalledWith('录制任务失败')
    })
  })

  it('ignores non-sync tasks', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:其他任务:a.mp4', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, skipped: 'not-sync-task' })
    })
  })

  it('ignores non-mp4 files', async () => {
    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:同步任务:a.mkv', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, skipped: 'non-mp4' })
    })
  })

  it('returns scan-failed on directory traversal errors', async () => {
    const findSpy = vi.spyOn(utils, 'findMatchingFile').mockRejectedValue(new Error('walk failed'))

    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:同步任务:a.mp4', dir: '/tmp' },
      })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({ ok: false, error: 'scan-failed' })
    })

    findSpy.mockRestore()
  })

  it('responds not-found when no matching files exist', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'delete-tests-'))
    tempDirs.push(dir)

    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:同步任务:missing.mp4', dir },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, deleted: false, reason: 'not-found' })
    })
  })

  it('stops when file is locked', async () => {
    const { dir, filePath } = await createTempFile('locked.mp4')
    const lockSpy = vi.spyOn(utils, 'isFileLocked').mockResolvedValue(true)

    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:同步任务:locked.mp4', dir },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, deleted: false, reason: 'locked' })
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    lockSpy.mockRestore()
  })

  it('deletes matching mp4 files after passing checks', async () => {
    const { dir, filePath } = await createTempFile('clip.mp4')
    const lockSpy = vi.spyOn(utils, 'isFileLocked').mockResolvedValue(false)

    await withApp(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/del',
        headers: { [AUTH_HEADER]: AUTH_SECRET },
        payload: { title: '成功:同步任务:clip.mp4', dir },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ ok: true, deleted: true })
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(false)
    })

    lockSpy.mockRestore()
  })
})
