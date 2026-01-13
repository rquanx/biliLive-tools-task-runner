import { logger } from '../logger'

const lastSendByTitle = new Map<string, number>()
const ONE_HOUR = 60 * 60 * 1000

function shouldSkip(title: string) {
  const now = Date.now()
  const last = lastSendByTitle.get(title)
  if (last && now - last < ONE_HOUR) {
    return true
  }
  lastSendByTitle.set(title, now)
  return false
}

export async function sendServerChan(title: string) {
  if (!title) return
  if (shouldSkip(title)) return

  const sendKey = process.env.SERVER_CHAN_SEND_KEY
  if (!sendKey || sendKey === '<SERVER_CHAN_SEND_KEY>') {
    logger.warn('SERVER_CHAN_SEND_KEY not set, skip server酱发送')
    return
  }

  try {
    await fetch(`https://sctapi.ftqq.com/${sendKey}.send?title=${encodeURIComponent(title)}`)
  } catch (err) {
    logger.warn({ err }, 'server酱发送失败，已忽略')
  }
}
