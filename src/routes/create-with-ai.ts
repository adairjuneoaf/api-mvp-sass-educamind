import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db/prisma';
import { openai } from '../lib/openai';

export const createWithAi = async (app: FastifyInstance) => {
  app.post('/videos/:videoId/create', async (req, res) => {
    const { body, params } = req;

    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    const bodySchema = z.object({
      templatePrompt: z.string(),
      temperature: z
        .number({ message: 'Must be a Number.' })
        .min(0, { message: 'Min value is 0.' })
        .max(1, { message: 'Max value is 1.' })
        .default(0.25)
        .optional(),
    });

    const { videoId } = paramsSchema.parse(params);
    const { temperature, templatePrompt } = bodySchema.parse(body);

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

    const promptMessage = templatePrompt.replace('{transcription}', video.transcription);

    const aiChatReturn = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [
        {
          role: 'developer',
          content:
            'Você é um chatbot para ajudar pessoas na geração de textos baseados em transcrições de conteúdos sobre tecnologia e programação.',
        },
        {
          role: 'developer',
          content:
            'Os conteúdos são gravados ou escritos por pessoas que entendem do assunto que está transcrito para que você possa utilizar.',
        },
        {
          role: 'developer',
          content:
            'Sempre se comporte como você sendo especialista nos assuntos. Não diga em terceira pessoa, citando como autor, desenvolvedor, escritor, palestrante ou algo do gênero.',
        },
        { role: 'user', content: promptMessage },
      ],
    });

    return res.status(200).send({ content: aiChatReturn });
  });
};
