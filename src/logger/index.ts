import pino from 'pino';
import { DailyLogger } from './daily-logger';

export const logger = pino({}, new DailyLogger());
