import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

const prisma = new PrismaClient();

export default async function registerPrisma(fastify: FastifyInstance) {
  // attach prisma client to fastify instance
  ;(fastify as any).prisma = prisma;

  fastify.addHook('onClose', async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
  });
}
