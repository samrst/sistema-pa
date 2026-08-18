import { FastifyInstance } from 'fastify';
import { listUnidadesHandler } from '../controllers/unidades';

export default async function unidadesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/unidades', listUnidadesHandler);
}
