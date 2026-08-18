import { PrismaClient, Perfil } from '@prisma/client';
import { UserPayload } from '../plugins/jwt';

export interface UserUnitScope {
  userId: string;
  perfil: 'ADMIN' | 'MACROPROCESSO_TECNICO' | 'USUARIO';
  unitIds: string[];
  unitNames: string[];
  unitNamesNormalized: string[];
}

/**
 * Obtém o escopo de unidades atualizado do usuário a partir do banco de dados.
 */
export async function getUserScope(prisma: PrismaClient, userPayload: UserPayload): Promise<UserUnitScope> {
  const userId = userPayload.id;
  const perfil = userPayload.perfil;

  if (perfil === 'ADMIN') {
    const allUnits = await prisma.unidade.findMany({ where: { ativo: true } });
    const unitIds = allUnits.map((u) => u.id);
    const unitNames = allUnits.map((u) => u.nome);
    const unitNamesNormalized = unitNames.map((n) => n.trim().toLowerCase());
    return {
      userId,
      perfil,
      unitIds,
      unitNames,
      unitNamesNormalized,
    };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      unidades: {
        include: {
          unidade: true,
        },
      },
    },
  });

  const activeUnits = (usuario?.unidades || [])
    .map((u) => u.unidade)
    .filter((u) => u && u.ativo);

  const unitIds = activeUnits.map((u) => u.id);
  const unitNames = activeUnits.map((u) => u.nome);
  const unitNamesNormalized = unitNames.map((n) => n.trim().toLowerCase());

  return {
    userId,
    perfil,
    unitIds,
    unitNames,
    unitNamesNormalized,
  };
}

/**
 * Constrói a cláusula WHERE do Prisma para listagem de ações respeitando o escopo do usuário.
 */
export function buildAcoesWhereClause(scope: UserUnitScope): any {
  if (scope.perfil === 'ADMIN') {
    return {};
  }

  if (scope.unitIds.length === 0) {
    return { id: '__no_access__' };
  }

  return {
    OR: [
      { unidade_id: { in: scope.unitIds } },
      {
        AND: [
          { unidade_id: null },
          { unidade: { in: scope.unitNames } },
        ],
      },
    ],
  };
}

/**
 * Verifica se o usuário tem permissão para visualizar uma ação específica.
 */
export function canViewAcao(
  scope: UserUnitScope,
  acao: { unidade_id?: string | null; unidade?: string | null } | null | undefined
): boolean {
  if (scope.perfil === 'ADMIN') return true;
  if (!acao) return false;

  if (acao.unidade_id && scope.unitIds.includes(acao.unidade_id)) {
    return true;
  }

  if (!acao.unidade_id && acao.unidade) {
    const norm = acao.unidade.trim().toLowerCase();
    return scope.unitNamesNormalized.includes(norm);
  }

  return false;
}

/**
 * Verifica se o usuário tem permissão para editar uma ação específica.
 */
export function canEditAcao(
  scope: UserUnitScope,
  acao: {
    unidade_id?: string | null;
    unidade?: string | null;
    usuario_criador_id?: string | null;
  } | null | undefined
): boolean {
  if (scope.perfil === 'ADMIN') return true;
  if (!acao) return false;

  if (scope.perfil === 'MACROPROCESSO_TECNICO') {
    return canViewAcao(scope, acao);
  }

  if (scope.perfil === 'USUARIO') {
    // Ação legada (usuario_criador_id = null) NÃO pode ser editada por USUARIO
    if (!acao.usuario_criador_id) {
      return false;
    }
    // Ação de outro usuário NÃO pode ser editada por USUARIO
    if (acao.usuario_criador_id !== scope.userId) {
      return false;
    }
    // Deve pertencer à unidade do usuário
    return canViewAcao(scope, acao);
  }

  return false;
}

/**
 * Valida se o usuário tem permissão para criar/mover uma ação para a unidade informada.
 */
export function canCreateInUnit(scope: UserUnitScope, targetUnitId: string): boolean {
  if (scope.perfil === 'ADMIN') return true;
  return scope.unitIds.includes(targetUnitId);
}

/**
 * Resolve a unidade ativa informada por id (UUID) ou por texto de nome oficial.
 */
export async function resolveUnit(
  prisma: PrismaClient,
  unidadeText?: string | null,
  unidadeId?: string | null
): Promise<{ id: string; nome: string } | null> {
  if (unidadeId && typeof unidadeId === 'string' && unidadeId.trim()) {
    const u = await prisma.unidade.findUnique({
      where: { id: unidadeId.trim() },
    });
    if (u && u.ativo) {
      return { id: u.id, nome: u.nome };
    }
  }

  if (unidadeText && typeof unidadeText === 'string' && unidadeText.trim()) {
    const trimmed = unidadeText.trim();
    const u = await prisma.unidade.findUnique({
      where: { nome: trimmed },
    });
    if (u && u.ativo) {
      return { id: u.id, nome: u.nome };
    }

    const all = await prisma.unidade.findMany({ where: { ativo: true } });
    const norm = trimmed.toLowerCase();
    const match = all.find((item) => item.nome.trim().toLowerCase() === norm);
    if (match) {
      return { id: match.id, nome: match.nome };
    }
  }

  return null;
}
