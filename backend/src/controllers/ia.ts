import { FastifyRequest, FastifyReply } from 'fastify';
import { analyzeAcoes } from '../services/ia';

export async function analyzeAcoesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { acoes } = request.body as { acoes?: any[] };

    if (!acoes || !Array.isArray(acoes) || acoes.length === 0) {
      return reply.status(400).send({
        error: 'acoes array is required and must not be empty.',
      });
    }

    const analise = await analyzeAcoes(acoes);

    return reply.send({ analise });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('analyzeAcoes error:', message);
    return reply.status(500).send({
      error: message || 'Failed to analyze actions.',
    });
  }
}
