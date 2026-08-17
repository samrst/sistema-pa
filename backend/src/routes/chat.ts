import { FastifyInstance } from 'fastify';
import { adminChatHandler } from '../controllers/chat';

export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.post('/api/chat', adminChatHandler);
}
