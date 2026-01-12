import fs from 'fs'
import path from 'path'
import pino, { destination as pd } from 'pino'

function getDate() {
  const d = new Date()
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function createDailyDestination() {
  const logsDir = path.resolve(process.cwd(), 'logs')
  fs.mkdirSync(logsDir, { recursive: true })

  let currentDate = getDate()
  let destination = pd({
    dest: path.join(logsDir, `${currentDate}.log`),
    sync: false,
  })

  // 定时检查是否跨天（每分钟一次，够用）
  setInterval(() => {
    const today = getDate()
    if (today !== currentDate) {
      destination.end?.()
      currentDate = today
      destination = pd({
        dest: path.join(logsDir, `${currentDate}.log`),
        sync: false,
      })
    }
  }, 60_000)

  return destination
}
