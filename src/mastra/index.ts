import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

export const mastra = new Mastra({
  logger: new PinoLogger({
    name: 'AI-Coding-CLI',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
});
