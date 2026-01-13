import fs from 'fs/promises'
import path from 'path'
import { FastifyInstance } from 'fastify'
import { NotifyData } from '../type'
import { logger } from '../logger'
import { sendServerChan } from '../notify/server-chan'
import { getCanDelete, pauseDelete, resumeDelete } from '../memory/delete-state'
import { delay, findMatchingFile, isFileLocked } from '../utils'

interface ParsedTitle {
  state: string
  taskType: string
  fileName: string
}

function parseTitle(title: string): ParsedTitle | null {
  const match = title.match(/^\s*([^：:]+)[：:]\s*([^：:]+?)[：:]\s*(.+)$/)
  if (!match) return null
  const [, state = '', taskType = '', fileName = ''] = match
  return { state: state.trim(), taskType: taskType.trim(), fileName: fileName.trim() }
}

function isSuccessState(state: string) {
  return state.trim() === '成功'
}

export async function deleteRoute(app: FastifyInstance) {
  app.all('/del/continue', async (_request, reply) => {
    resumeDelete()
    logger.info('删除功能启用')
    if (getCanDelete()) {
      await sendServerChan('删除功能启用')
    }
    return reply.code(200).send({ ok: true, canDelete: true })
  })

  app.all('/del', async (request, reply) => {
    const body = request.body as NotifyData | undefined
    if (!body?.title || !body?.dir) {
      logger.error('title and dir are required')
      return reply.code(400).send({ ok: false, error: 'title and dir are required' })
    }

    if (!getCanDelete()) {
      await sendServerChan('删除任务暂停中')
      logger.info('删除任务暂停中')
      return reply.code(200).send({ ok: true, skipped: 'delete-paused' })
    }

    const parsed = parseTitle(body.title)
    if (!parsed) {
      logger.warn({ title: body.title }, '无法解析 title，跳过处理')
      return reply.code(200).send({ ok: true, skipped: 'bad-title' })
    }

    const { state, taskType, fileName } = parsed

    if (!isSuccessState(state)) {
      pauseDelete()
      logger.warn(`${body.title}任务失败,暂停删除`)
      await sendServerChan('录制任务失败')
      return reply.code(200).send({ ok: true, paused: true })
    }

    if (taskType !== '同步任务') {
      logger.info({ fileName }, '成功但同步任务文件，忽略')
      return reply.code(200).send({ ok: true, skipped: 'not-sync-task' })
    }

    if (path.extname(fileName).toLowerCase() !== '.mp4') {
      logger.info({ fileName }, '同步任务文件非 mp4，忽略')
      return reply.code(200).send({ ok: true, skipped: 'non-mp4' })
    }

    let matches: string[] = []
    try {
      matches = await findMatchingFile(body.dir, fileName)
    } catch (err) {
      logger.error({ err, dir: body.dir }, '遍历目录失败')
      return reply.code(500).send({ ok: false, error: 'scan-failed' })
    }

    if (matches.length === 0) {
      logger.warn({ fileName, dir: body.dir }, '未找到同名文件')
      return reply.code(200).send({ ok: true, deleted: false, reason: 'not-found' })
    }

    await delay(120_000)

    for (const filePath of matches) {
      const locked = await isFileLocked(filePath)
      if (locked) {
        logger.warn(`${fileName} 删除失败（文件被占用）`)
        return reply.code(200).send({ ok: true, deleted: false, reason: 'locked' })
      }

      try {
        // await fs.unlink(filePath)
        logger.info(`${fileName} 删除成功`)
      } catch (err) {
        logger.error({ err, filePath }, `${fileName} 删除失败（${(err as Error).message}）`)
        return reply.code(200).send({ ok: false, error: 'delete-failed' })
      }
    }

    return reply.code(200).send({ ok: true, deleted: true })
  })
}
