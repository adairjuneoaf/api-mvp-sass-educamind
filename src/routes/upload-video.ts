import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

import { FastifyInstance } from 'fastify';
import { dirname } from 'path';

import { prisma } from '../db/prisma';

const pumpUpload = promisify(pipeline);

export const uploadPrompts = async (app: FastifyInstance) => {
  app.post('/videos', async (req, res) => {
    const data = await req.file();

    if (!data) {
      return res.status(400).send({ error: 'Missing file input.' });
    }

    const extension = path.extname(data.filename);

    if (extension !== '.mp3') {
      return res.status(400).send({ error: 'Invalid input type, please upload a MP3 file.' });
    }

    const newFileName = String(path.basename(data.filename, extension))
      .concat('-')
      .concat(randomUUID())
      .concat(extension);

    const uploadDestination = path.resolve(dirname(''), './tmp', newFileName);

    await pumpUpload(data.file, fs.createWriteStream(uploadDestination));

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        slug: uploadDestination,
      },
    });

    return res.status(201).send({ content: video });
  });
};
