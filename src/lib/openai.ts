import { createOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';

import { env } from '../env';

export const openai = new OpenAI({ apiKey: env.OPENAI_KEY });

export const chat = createOpenAI({ apiKey: env.OPENAI_KEY });
