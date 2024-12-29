import { createReadStream } from 'node:fs';

import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db/prisma';
import { openai } from '../lib/openai';

export const createTranscription = async (app: FastifyInstance) => {
  app.post('/video/:videoId/transcription', async (req, res) => {
    const { body, params } = req;

    const paramsSchema = z.object({ videoId: z.string().uuid() });
    const bodySchema = z.object({ prompt: z.string().optional() });

    const { videoId } = paramsSchema.parse(params);
    const { prompt } = bodySchema.parse(body);

    if (!videoId) {
      return res.status(400).send({ error: 'Please send a video id to create transcription.' });
    }

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    });

    const videoSlug = video.slug;
    const audioStreamed = createReadStream(videoSlug);

    const audioTranscribe = await openai.audio.transcriptions.create({
      file: audioStreamed,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt: prompt,
    });

    const videoUpdated = await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription: audioTranscribe.text,
      },
    });

    return res.status(200).send({ content: videoUpdated });
  });
};
