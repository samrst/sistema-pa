import Fastify from 'fastify';
import registerPrisma from './plugins/prisma';
import registerJwt from './plugins/jwt';
import acoesRoutes from './routes/acoes';
import iaRoutes from './routes/ia';
import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';
import usuariosRoutes from './routes/usuarios';
import unidadesRoutes from './routes/unidades';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function buildServer() {
  const fastify = Fastify({ logger: true });

  // CORS handling
  fastify.addHook('onRequest', async (request, reply) => {
    const reqOrigin = request.headers.origin;
    const allowed = reqOrigin && (reqOrigin.includes('localhost') || reqOrigin.includes('127.0.0.1'))
      ? reqOrigin
      : ORIGIN;

    reply.header('Access-Control-Allow-Origin', allowed);
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });

  // Register plugins
  await registerPrisma(fastify);
  await registerJwt(fastify);

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
  await authRoutes(fastify);
  await usuariosRoutes(fastify);
  await unidadesRoutes(fastify);
  await acoesRoutes(fastify);
  await iaRoutes(fastify);
  await chatRoutes(fastify);

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
