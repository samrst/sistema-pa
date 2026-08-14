import { FastifyInstance } from 'fastify';
import { listAcoes, getAcao, createAcao, updateAcao, deleteAcao } from '../controllers/acoes';

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/api/acoes', listAcoes);
  fastify.get('/api/acoes/:id', getAcao);
  fastify.post('/api/acoes', createAcao);
  fastify.put('/api/acoes/:id', updateAcao);
  fastify.delete('/api/acoes/:id', deleteAcao);
}
