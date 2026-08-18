import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getUserScope,
  buildAcoesWhereClause,
  canViewAcao,
  canEditAcao,
  canCreateInUnit,
  resolveUnit,
} from '../services/auth-helper';

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
    if (
      normalized.custo_estimado === null ||
      normalized.custo_estimado === undefined ||
      normalized.custo_estimado === ''
    ) {
      normalized.custo_estimado = null;
    } else {
      const num = Number(normalized.custo_estimado);
      normalized.custo_estimado = Number.isNaN(num) ? null : num;
    }
  }

  if (
    normalized.apoios_necessarios !== undefined &&
    normalized.apoios_necessarios !== null &&
    !Array.isArray(normalized.apoios_necessarios)
  ) {
    normalized.apoios_necessarios = null;
  }

  return normalized;
}

export async function listAcoes(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const scope = await getUserScope(prisma, request.user);
  const where = buildAcoesWhereClause(scope);

  const acoes = await prisma.acoesSaep.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  return reply.send(acoes);
}

export async function getAcao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const prisma = (request.server as any).prisma;
  const scope = await getUserScope(prisma, request.user);

  const acao = await prisma.acoesSaep.findUnique({ where: { id } });
  if (!acao) {
    return reply.status(404).send({ error: 'Ação não encontrada.' });
  }

  if (!canViewAcao(scope, acao)) {
    return reply.status(403).send({
      error: 'Acesso proibido. Ação fora do escopo de unidades permitido para seu usuário.',
    });
  }

  return reply.send(acao);
}

export async function createAcao(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const scope = await getUserScope(prisma, request.user);
  const payload = normalizePayload(request.body as any);

  // Validação básica dos campos obrigatórios
  const required = ['acao', 'tipo_acao', 'responsavel_principal', 'capacidade_saep', 'curso'];
  for (const f of required) {
    if (!payload?.[f]) {
      return reply.status(400).send({ error: `${f} é obrigatório.` });
    }
  }

  // Resolução da unidade por ID ou Nome textual
  if (!payload.unidade && !payload.unidade_id) {
    return reply.status(400).send({ error: 'unidade é obrigatória.' });
  }

  const unit = await resolveUnit(prisma, payload.unidade, payload.unidade_id);
  if (!unit) {
    return reply.status(400).send({ error: 'Unidade informada é inválida ou não está ativa.' });
  }

  // Verificação de permissão para a unidade
  if (!canCreateInUnit(scope, unit.id)) {
    return reply.status(403).send({
      error: 'Acesso proibido. Você não tem permissão para cadastrar ações nesta unidade.',
    });
  }

  // Preenche dados resolvidos e força criador a partir do token
  payload.unidade_id = unit.id;
  payload.unidade = unit.nome;
  payload.usuario_criador_id = request.user.id;

  // Garante remoção de campos sensíveis/impróprios
  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;

  // Validação de apoios_necessarios
  if (payload.apoios_necessarios && !Array.isArray(payload.apoios_necessarios)) {
    return reply.status(400).send({ error: 'apoios_necessarios deve ser um array ou null.' });
  }

  const created = await prisma.acoesSaep.create({ data: payload });
  return reply.status(201).send(created);
}

export async function updateAcao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const prisma = (request.server as any).prisma;
  const scope = await getUserScope(prisma, request.user);

  const existing = await prisma.acoesSaep.findUnique({ where: { id } });
  if (!existing) {
    return reply.status(404).send({ error: 'Ação não encontrada.' });
  }

  // Valida se o usuário tem permissão para editar esta ação
  if (!canEditAcao(scope, existing)) {
    return reply.status(403).send({
      error: 'Acesso proibido. Você não tem permissão para editar esta ação.',
    });
  }

  const payload = normalizePayload(request.body as any);

  // Bloqueia alteração de campos protegidos
  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;
  delete payload.usuario_criador_id;

  // Se houver alteração de unidade, valida e resolve a nova unidade
  if (payload.unidade !== undefined || payload.unidade_id !== undefined) {
    const targetUnit = await resolveUnit(prisma, payload.unidade, payload.unidade_id);
    if (!targetUnit) {
      return reply.status(400).send({ error: 'Nova unidade informada é inválida ou não está ativa.' });
    }

    if (!canCreateInUnit(scope, targetUnit.id)) {
      return reply.status(403).send({
        error: 'Acesso proibido. Você não tem permissão para mover a ação para esta unidade.',
      });
    }

    payload.unidade_id = targetUnit.id;
    payload.unidade = targetUnit.nome;
  } else if (!existing.unidade_id && scope.perfil === 'ADMIN') {
    // Se for ação legada sem unidade_id e for editada pelo ADMIN, vincula unidade_id automaticamente
    const resolved = await resolveUnit(prisma, existing.unidade, null);
    if (resolved) {
      payload.unidade_id = resolved.id;
    }
  }

  try {
    const updated = await prisma.acoesSaep.update({ where: { id }, data: payload });
    return reply.send(updated);
  } catch (e: any) {
    return reply.status(400).send({ error: 'Erro ao atualizar ação.' });
  }
}

export async function deleteAcao(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const prisma = (request.server as any).prisma;
  const scope = await getUserScope(prisma, request.user);

  if (scope.perfil !== 'ADMIN') {
    return reply.status(403).send({
      error: 'Acesso proibido. Somente administradores podem excluir ações.',
    });
  }

  const existing = await prisma.acoesSaep.findUnique({ where: { id } });
  if (!existing) {
    return reply.status(404).send({ error: 'Ação não encontrada.' });
  }

  await prisma.acoesSaep.delete({ where: { id } });
  return reply.status(204).send();
}
