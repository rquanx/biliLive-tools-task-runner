import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${typeof message === 'string' ? message : JSON.stringify(message)}`)
  ),
  transports: [
    // 滚动文件
    new transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
})
