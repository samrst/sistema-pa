import { FastifyInstance } from 'fastify';
import { listAcoes, getAcao, createAcao, updateAcao, deleteAcao } from '../controllers/acoes';
import { authenticate, authorizeRoles } from '../plugins/jwt';

export default async function routes(fastify: FastifyInstance) {
  const authOnly = { preHandler: [authenticate] };
  const adminOnly = { preHandler: [authenticate, authorizeRoles('ADMIN')] };

  fastify.get('/api/acoes', authOnly, listAcoes);
  fastify.get('/api/acoes/:id', authOnly, getAcao);
  fastify.post('/api/acoes', authOnly, createAcao);
  fastify.put('/api/acoes/:id', authOnly, updateAcao);
  fastify.delete('/api/acoes/:id', adminOnly, deleteAcao);
}
