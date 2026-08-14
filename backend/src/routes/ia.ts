import { FastifyInstance } from 'fastify';
import { analyzeAcoesHandler } from '../controllers/ia';

export default async function iaRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ia/analyze', analyzeAcoesHandler);
}
