import { FastifyRequest, FastifyReply } from 'fastify';
import { Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

type ParamsId = { Params: { id: string } };

function validateUnidadesPerfil(perfil: Perfil, unidadesIds?: string[]): string | null {
  const count = unidadesIds?.length || 0;

  if (perfil === Perfil.MACROPROCESSO_TECNICO) {
    if (count < 1) {
      return 'Macroprocesso Técnico deve possuir pelo menos uma unidade vinculada.';
    }
  } else if (perfil === Perfil.USUARIO) {
    if (count !== 1) {
      return 'Usuário padrão deve possuir exatamente uma unidade vinculada.';
    }
  }

  // ADMIN pode ter 0 ou mais unidades
  return null;
}

export async function listUsuariosHandler(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;

  const usuarios = await prisma.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
      updated_at: true,
      unidades: {
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  const formatted = usuarios.map((u: any) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    ativo: u.ativo,
    unidades: u.unidades.map((uu: any) => uu.unidade),
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));

  return reply.send(formatted);
}

export async function getUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const prisma = (request.server as any).prisma;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
      updated_at: true,
      unidades: {
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    return reply.status(404).send({ error: 'Usuário não encontrado.' });
  }

  return reply.send({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    unidades: usuario.unidades.map((uu: any) => uu.unidade),
    created_at: usuario.created_at,
    updated_at: usuario.updated_at,
  });
}

export async function createUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const body = request.body as {
    nome?: string;
    email?: string;
    senha?: string;
    perfil?: Perfil;
    unidades_ids?: string[];
  };

  if (!body || typeof body !== 'object') {
    return reply.status(400).send({ error: 'Corpo da requisição inválido.' });
  }

  const { nome, email, senha, perfil, unidades_ids } = body;

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return reply.status(400).send({ error: 'Nome é obrigatório.' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return reply.status(400).send({ error: 'E-mail é obrigatório.' });
  }

  if (!senha || typeof senha !== 'string' || senha.length < 6) {
    return reply.status(400).send({ error: 'Senha é obrigatória e deve conter no mínimo 6 caracteres.' });
  }

  if (!perfil || !Object.values(Perfil).includes(perfil)) {
    return reply.status(400).send({ error: 'Perfil inválido. Deve ser ADMIN, MACROPROCESSO_TECNICO ou USUARIO.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validar unicidade do e-mail
  const existingUser = await prisma.usuario.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return reply.status(400).send({ error: 'E-mail já cadastrado.' });
  }

  // Validar regras de vínculo de unidade por perfil
  const normalizedUnidadesIds = Array.isArray(unidades_ids) ? Array.from(new Set(unidades_ids.filter(Boolean))) : [];
  const erroUnidades = validateUnidadesPerfil(perfil, normalizedUnidadesIds);
  if (erroUnidades) {
    return reply.status(400).send({ error: erroUnidades });
  }

  // Se foram informadas unidades, validar se existem no banco
  if (normalizedUnidadesIds.length > 0) {
    const unidadesEncontradas = await prisma.unidade.findMany({
      where: { id: { in: normalizedUnidadesIds } },
      select: { id: true },
    });

    if (unidadesEncontradas.length !== normalizedUnidadesIds.length) {
      return reply.status(400).send({ error: 'Uma ou mais unidades informadas não existem.' });
    }
  }

  // Criptografar senha
  const senhaHash = await bcrypt.hash(senha, 10);

  // Criar usuário e vínculos dentro de transação
  const novoUsuarioId = randomUUID();
  const novoUsuario = await prisma.$transaction(async (tx: any) => {
    const u = await tx.usuario.create({
      data: {
        id: novoUsuarioId,
        nome: nome.trim(),
        email: normalizedEmail,
        senha_hash: senhaHash,
        perfil,
        ativo: true,
      },
    });

    if (normalizedUnidadesIds.length > 0) {
      await tx.usuarioUnidade.createMany({
        data: normalizedUnidadesIds.map((unidade_id) => ({
          id: randomUUID(),
          usuario_id: u.id,
          unidade_id,
        })),
      });
    }

    return u;
  });

  // Retornar usuário criado com suas unidades
  const usuarioCriado = await prisma.usuario.findUnique({
    where: { id: novoUsuario.id },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
      updated_at: true,
      unidades: {
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  return reply.status(201).send({
    id: usuarioCriado.id,
    nome: usuarioCriado.nome,
    email: usuarioCriado.email,
    perfil: usuarioCriado.perfil,
    ativo: usuarioCriado.ativo,
    unidades: usuarioCriado.unidades.map((uu: any) => uu.unidade),
    created_at: usuarioCriado.created_at,
    updated_at: usuarioCriado.updated_at,
  });
}

export async function updateUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const prisma = (request.server as any).prisma;
  const body = request.body as {
    nome?: string;
    email?: string;
    perfil?: Perfil;
    ativo?: boolean;
    unidades_ids?: string[];
  };

  if (!body || typeof body !== 'object') {
    return reply.status(400).send({ error: 'Corpo da requisição inválido.' });
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { id },
    include: {
      unidades: { select: { unidade_id: true } },
    },
  });

  if (!existingUser) {
    return reply.status(404).send({ error: 'Usuário não encontrado.' });
  }

  const { nome, email, perfil, ativo, unidades_ids } = body;

  const targetPerfil = perfil || existingUser.perfil;
  if (perfil && !Object.values(Perfil).includes(perfil)) {
    return reply.status(400).send({ error: 'Perfil inválido.' });
  }

  let normalizedEmail: string | undefined = undefined;
  if (email !== undefined) {
    if (typeof email !== 'string' || !email.trim()) {
      return reply.status(400).send({ error: 'E-mail não pode ser vazio.' });
    }
    normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== existingUser.email) {
      const emailEmUso = await prisma.usuario.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailEmUso) {
        return reply.status(400).send({ error: 'E-mail já está em uso por outro usuário.' });
      }
    }
  }

  // Se unidades_ids for passado, valida e normaliza
  let targetUnidadesIds: string[] = existingUser.unidades.map((u: any) => u.unidade_id);
  if (unidades_ids !== undefined) {
    if (!Array.isArray(unidades_ids)) {
      return reply.status(400).send({ error: 'unidades_ids deve ser uma lista.' });
    }
    targetUnidadesIds = Array.from(new Set(unidades_ids.filter(Boolean)));
  }

  // Validar regras de perfil com as unidades de destino
  const erroUnidades = validateUnidadesPerfil(targetPerfil, targetUnidadesIds);
  if (erroUnidades) {
    return reply.status(400).send({ error: erroUnidades });
  }

  // Se unidades foram modificadas, verificar se todas existem
  if (unidades_ids !== undefined && targetUnidadesIds.length > 0) {
    const unidadesEncontradas = await prisma.unidade.findMany({
      where: { id: { in: targetUnidadesIds } },
      select: { id: true },
    });

    if (unidadesEncontradas.length !== targetUnidadesIds.length) {
      return reply.status(400).send({ error: 'Uma ou mais unidades informadas não existem.' });
    }
  }

  // Executar atualização transacional
  await prisma.$transaction(async (tx: any) => {
    await tx.usuario.update({
      where: { id },
      data: {
        ...(nome && typeof nome === 'string' && nome.trim() ? { nome: nome.trim() } : {}),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        ...(perfil ? { perfil } : {}),
        ...(typeof ativo === 'boolean' ? { ativo } : {}),
      },
    });

    if (unidades_ids !== undefined) {
      await tx.usuarioUnidade.deleteMany({
        where: { usuario_id: id },
      });

      if (targetUnidadesIds.length > 0) {
        await tx.usuarioUnidade.createMany({
          data: targetUnidadesIds.map((unidade_id) => ({
            id: randomUUID(),
            usuario_id: id,
            unidade_id,
          })),
        });
      }
    }
  });

  const usuarioAtualizado = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      created_at: true,
      updated_at: true,
      unidades: {
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  return reply.send({
    id: usuarioAtualizado.id,
    nome: usuarioAtualizado.nome,
    email: usuarioAtualizado.email,
    perfil: usuarioAtualizado.perfil,
    ativo: usuarioAtualizado.ativo,
    unidades: usuarioAtualizado.unidades.map((uu: any) => uu.unidade),
    created_at: usuarioAtualizado.created_at,
    updated_at: usuarioAtualizado.updated_at,
  });
}

export async function updateSenhaUsuarioHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const prisma = (request.server as any).prisma;
  const body = request.body as { senha?: string };

  if (!body || typeof body !== 'object' || !body.senha || typeof body.senha !== 'string' || body.senha.length < 6) {
    return reply.status(400).send({ error: 'Senha é obrigatória e deve conter no mínimo 6 caracteres.' });
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!existingUser) {
    return reply.status(404).send({ error: 'Usuário não encontrado.' });
  }

  const senhaHash = await bcrypt.hash(body.senha, 10);

  await prisma.usuario.update({
    where: { id },
    data: {
      senha_hash: senhaHash,
    },
  });

  return reply.send({ message: 'Senha atualizada com sucesso.' });
}
