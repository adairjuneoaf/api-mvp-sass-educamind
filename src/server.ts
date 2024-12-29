import { fastifyCors } from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { fastify } from 'fastify';

import { createTranscription } from './routes/create-transcription';
import { createWithAi } from './routes/create-with-ai';
import { getPrompts } from './routes/get-prompts';
import { uploadPrompts } from './routes/upload-video';

const app = fastify();

app.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST'],
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 1048576 * 25, // 25MB máximo
    files: 1,
  },
});

app.register(getPrompts);
app.register(uploadPrompts);
app.register(createTranscription);
app.register(createWithAi);

app.listen({ port: 3333 }, (error) => {
  if (error) throw error;
  console.log('🚀 HTTP server is running on ');
  console.log(app.server.address());
});
