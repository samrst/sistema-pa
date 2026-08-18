import { FastifyInstance } from 'fastify';
import { adminChatHandler } from '../controllers/chat';
import { authenticate, authorizeRoles } from '../plugins/jwt';

export default async function chatRoutes(fastify: FastifyInstance) {
  const allowed = {
    preHandler: [authenticate, authorizeRoles('ADMIN', 'MACROPROCESSO_TECNICO')],
  };

  fastify.post('/api/chat', allowed, adminChatHandler);
}
