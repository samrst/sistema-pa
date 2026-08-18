import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const body = request.body as { email?: string; senha?: string };

  if (!body || typeof body !== 'object') {
    return reply.status(400).send({ error: 'Corpo da requisição inválido.' });
  }

  const { email, senha } = body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return reply.status(400).send({ error: 'E-mail é obrigatório.' });
  }

  if (!senha || typeof senha !== 'string' || !senha.trim()) {
    return reply.status(400).send({ error: 'Senha é obrigatória.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const usuario = await prisma.usuario.findUnique({
    where: { email: normalizedEmail },
    include: {
      unidades: {
        select: { unidade_id: true },
      },
    },
  });

  // Usuário inexistente -> 401 com mensagem genérica
  if (!usuario) {
    return reply.status(401).send({ error: 'Credenciais inválidas.' });
  }

  // Usuário inativo -> 403
  if (!usuario.ativo) {
    return reply.status(403).send({ error: 'Usuário inativo. Entre em contato com o administrador.' });
  }

  // Comparação da senha com bcrypt
  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) {
    // Senha incorreta -> 401 com mensagem genérica
    return reply.status(401).send({ error: 'Credenciais inválidas.' });
  }

  const unidadesIds = usuario.unidades.map((u: any) => u.unidade_id);

  // Geração do JWT assinado
  const token = (request.server as any).jwt.sign({
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil,
    unidades: unidadesIds,
  });

  return reply.send({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      unidades: unidadesIds,
    },
  });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const prisma = (request.server as any).prisma;
  const userId = request.user.id;

  // Consulta atualizada no banco de dados
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      unidades: {
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              ativo: true,
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    return reply.status(401).send({ error: 'Usuário não encontrado ou sessão inválida.' });
  }

  if (!usuario.ativo) {
    return reply.status(403).send({ error: 'Usuário inativo.' });
  }

  const unidades = usuario.unidades.map((u: any) => u.unidade);

  return reply.send({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      unidades,
    },
  });
}
