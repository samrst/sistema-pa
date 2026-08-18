import { FastifyInstance } from 'fastify';
import {
  listUsuariosHandler,
  getUsuarioHandler,
  createUsuarioHandler,
  updateUsuarioHandler,
  updateSenhaUsuarioHandler,
} from '../controllers/usuarios';
import { authenticate, authorizeRoles } from '../plugins/jwt';

export default async function usuariosRoutes(fastify: FastifyInstance) {
  const adminOnly = { preHandler: [authenticate, authorizeRoles('ADMIN')] };

  fastify.get('/api/usuarios', adminOnly, listUsuariosHandler);
  fastify.post('/api/usuarios', adminOnly, createUsuarioHandler);
  fastify.get('/api/usuarios/:id', adminOnly, getUsuarioHandler);
  fastify.put('/api/usuarios/:id', adminOnly, updateUsuarioHandler);
  fastify.put('/api/usuarios/:id/senha', adminOnly, updateSenhaUsuarioHandler);
}
