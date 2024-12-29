import { FastifyInstance } from 'fastify';

import { prisma } from '../db/prisma';

export const getPrompts = async (app: FastifyInstance) => {
  app.get('/prompts', async (req, res) => {
    const prompts = await prisma.prompt.findMany();

    return res.status(200).send({ content: prompts });
  });
};
