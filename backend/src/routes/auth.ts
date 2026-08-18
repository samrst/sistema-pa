import { FastifyInstance } from 'fastify';
import { loginHandler, meHandler } from '../controllers/auth';
import { authenticate } from '../plugins/jwt';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/login', loginHandler);
  fastify.get('/api/auth/me', { preHandler: [authenticate] }, meHandler);
}
