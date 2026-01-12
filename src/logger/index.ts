// logger/index.ts
import pino from 'pino'
import { createDailyDestination } from './daily-destination'

export const logger = pino(
  {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  createDailyDestination()
)
