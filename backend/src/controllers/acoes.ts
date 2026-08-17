import { FastifyRequest, FastifyReply } from 'fastify';

type ParamsId = { Params: { id: string } };

function normalizeOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function normalizePayload(payload: any) {
  if (!payload || typeof payload !== 'object') return {};
  const normalized = { ...payload };

  const dateFields = ['meta_prazo', 'data_inicio', 'data_fim'];
  for (const field of dateFields) {
    if (field in normalized) {
      normalized[field] = normalizeOptionalDate(normalized[field]);
    }
  }

  if ('custo_estimado' in normalized) {
    if (normalized.custo_estimado === null || normalized.custo_estimado === undefined || normalized.custo_estimado === '') {
      normalized.custo_estimado = null;
    } else {
      const num = Number(normalized.custo_estimado);
      normalized.custo_estimado = Number.isNaN(num) ? null : num;
    }
  }

  if (normalized.apoios_necessarios !== undefined && normalized.apoios_necessarios !== null && !Array.isArray(normalized.apoios_necessarios)) {
    normalized.apoios_necessarios = null;
  }

  return normalized;
}

export async function listAcoes(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const acoes = await prisma.acoesSaep.findMany({ orderBy: { created_at: 'desc' } });
  return reply.send(acoes);
}

export async function getAcao(request: FastifyRequest<ParamsId>, reply: FastifyReply) {
  const { id } = request.params;
  const prisma = (request.server as any).prisma;
  const acao = await prisma.acoesSaep.findUnique({ where: { id } });
  if (!acao) return reply.status(404).send({ error: 'Not found' });
  return reply.send(acao);
}

export async function createAcao(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const payload = normalizePayload(request.body as any);

  // Basic validation for required fields
  const required = ['acao', 'tipo_acao', 'responsavel_principal', 'capacidade_saep', 'curso', 'unidade'];
  for (const f of required) {
    if (!payload?.[f]) return reply.status(400).send({ error: `${f} is required` });
  }

  // Ensure apoios_necessarios is either null or JSON array
  if (payload.apoios_necessarios && !Array.isArray(payload.apoios_necessarios)) {
    return reply.status(400).send({ error: 'apoios_necessarios must be an array or null' });
  }

  const created = await prisma.acoesSaep.create({ data: payload });
  return reply.status(201).send(created);
}

export async function updateAcao(request: FastifyRequest<ParamsId>, reply: FastifyReply) {
  const { id } = request.params as any;
  const prisma = (request.server as any).prisma;
  const payload = normalizePayload(request.body as any);

  // Prevent updating id or created_at
  delete payload.id;
  delete payload.created_at;

  try {
    const updated = await prisma.acoesSaep.update({ where: { id }, data: payload });
    return reply.send(updated);
  } catch (e: any) {
    return reply.status(404).send({ error: 'Not found or update failed' });
  }
}

export async function deleteAcao(request: FastifyRequest<ParamsId>, reply: FastifyReply) {
  const { id } = request.params as any;
  const prisma = (request.server as any).prisma;
  try {
    await prisma.acoesSaep.delete({ where: { id } });
    return reply.status(204).send();
  } catch (e: any) {
    return reply.status(404).send({ error: 'Not found or delete failed' });
  }
}
