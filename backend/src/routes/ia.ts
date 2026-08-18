import { FastifyInstance } from 'fastify';
import { analyzeAcoesHandler } from '../controllers/ia';
import { authenticate, authorizeRoles } from '../plugins/jwt';

export default async function iaRoutes(fastify: FastifyInstance) {
  const allowed = {
    preHandler: [authenticate, authorizeRoles('ADMIN', 'MACROPROCESSO_TECNICO')],
  };

  fastify.post('/api/ia/analyze', allowed, analyzeAcoesHandler);
}
