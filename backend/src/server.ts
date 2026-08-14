import Fastify from 'fastify';
import registerPrisma from './plugins/prisma';
import acoesRoutes from './routes/acoes';
import iaRoutes from './routes/ia';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function buildServer() {
  const fastify = Fastify({ logger: true });

  // Basic CORS handling without external plugin
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', ORIGIN);
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });

  // Register Prisma plugin
  await registerPrisma(fastify);

  // Health endpoint
  fastify.get('/health', async (req, reply) => {
    // simple DB check if prisma available
    try {
      const prisma = (fastify as any).prisma;
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        return reply.send({ status: 'ok', db: true });
      }
    } catch (e) {
      return reply.send({ status: 'ok', db: false });
    }
    return reply.send({ status: 'ok', db: false });
  });

  // Register routes
  await acoesRoutes(fastify);
  await iaRoutes(fastify);

  return fastify;
}

if (require.main === module) {
  (async () => {
    const fastify = await buildServer();
    try {
      await fastify.listen({ port: PORT, host: '0.0.0.0' });
      fastify.log.info(`Server listening on ${PORT}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  })();
}

export default buildServer;
