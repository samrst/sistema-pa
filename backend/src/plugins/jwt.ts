import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export type UserPayload = {
  id: string;
  email: string;
  nome: string;
  perfil: 'ADMIN' | 'MACROPROCESSO_TECNICO' | 'USUARIO';
  unidades: string[];
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}

export default async function registerJwt(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  await fastify.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: '7d',
    },
  });
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err: any) {
    return reply.status(401).send({
      error: 'Não autorizado. Token ausente, inválido ou expirado.',
    });
  }
}

export function authorizeRoles(...allowedRoles: Array<'ADMIN' | 'MACROPROCESSO_TECNICO' | 'USUARIO'>) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || !allowedRoles.includes(request.user.perfil)) {
      return reply.status(403).send({
        error: 'Acesso proibido. Perfil sem permissão para acessar este recurso.',
      });
    }
  };
}
