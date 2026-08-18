import { FastifyRequest, FastifyReply } from 'fastify';

export async function listUnidadesHandler(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;

  const unidades = await prisma.unidade.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativo: true,
    },
  });

  return reply.send(unidades);
}
