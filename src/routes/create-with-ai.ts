import { streamText } from 'ai';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db/prisma';
import { chat } from '../lib/openai';

export const createWithAi = async (app: FastifyInstance) => {
  app.post('/videos/:videoId/create', async (req, res) => {
    const { body, params } = req;

    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    const bodySchema = z.object({
      prompt: z.string(),
      temperature: z
        .number({ message: 'Must be a Number.' })
        .min(0, { message: 'Min value is 0.' })
        .max(1, { message: 'Max value is 1.' })
        .default(0.25)
        .optional(),
    });

    const { videoId } = paramsSchema.parse(params);
    const { temperature, prompt } = bodySchema.parse(body);

    if (!videoId) {
      return res.status(400).send({ error: 'Please send a video id to create transcription.' });
    }

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    });

    if (!video.transcription) {
      return res.status(400).send({ error: 'Video transcription was not generated yet.' });
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription);

    const aiChatReturn = streamText({
      model: chat('gpt-3.5-turbo'),
      temperature,
      messages: [{ role: 'user', content: promptMessage }],
    });

    res.header('X-Vercel-AI-Data-Stream', 'v1');
    res.header('content-type', 'text/plain; charset=utf-8');
    res.header('Cache-Control', 'no-cache');
    res.header('Access-Control-Allow-Methods', 'POST');

    return res.send(aiChatReturn.textStream);
  });
};
