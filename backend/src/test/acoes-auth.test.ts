import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import buildServer from '../server';
import { PrismaClient, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

describe('PHASE 6.4 — Autorização Backend-First e Regras de Negócio por Perfil', () => {
  let app: any;
  let baseUrl: string;
  let prisma: PrismaClient;

  let adminToken: string;
  let macroToken: string;
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;

  let unit1Id: string;
  let unit1Nome: string;
  let unit2Id: string;
  let unit2Nome: string;

  let adminId: string;
  let macroId: string;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;

  let acaoUser1Id: string;
  let acaoUser2Id: string;
  let acaoUser3Id: string;
  let acaoLegadaId: string;

  async function api(
    path: string,
    options: { method?: string; body?: any; token?: string } = {}
  ) {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let data: any = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      data,
    };
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-phase-6-4';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'mysql://sistema_pa:saep@localhost:3306/sistema_pa';

    app = await buildServer();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const port = (app.server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    prisma = new PrismaClient();
    await prisma.$connect();

    // 1. Obter 2 unidades ativas
    const unidades = await prisma.unidade.findMany({
      where: { ativo: true },
      take: 2,
      orderBy: { nome: 'asc' },
    });
    unit1Id = unidades[0].id;
    unit1Nome = unidades[0].nome;
    unit2Id = unidades[1].id;
    unit2Nome = unidades[1].nome;

    const defaultPassword = 'TestPassword123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 2. Criar / Atualizar Usuário ADMIN
    const adminEmail = 'admin.auth64@fbest.org.br';
    const admin = await prisma.usuario.upsert({
      where: { email: adminEmail },
      update: { senha_hash: passwordHash, ativo: true },
      create: {
        id: randomUUID(),
        nome: 'Admin Phase 6.4',
        email: adminEmail,
        senha_hash: passwordHash,
        perfil: Perfil.ADMIN,
        ativo: true,
      },
    });
    adminId = admin.id;

    // 3. Criar Usuário MACROPROCESSO_TECNICO vinculado à Unidade 1
    const macroEmail = 'macro.auth64@fbest.org.br';
    const macro = await prisma.usuario.upsert({
      where: { email: macroEmail },
      update: { senha_hash: passwordHash, ativo: true },
      create: {
        id: randomUUID(),
        nome: 'Macroprocesso Unit 1',
        email: macroEmail,
        senha_hash: passwordHash,
        perfil: Perfil.MACROPROCESSO_TECNICO,
        ativo: true,
      },
    });
    macroId = macro.id;
    await prisma.usuarioUnidade.deleteMany({ where: { usuario_id: macroId } });
    await prisma.usuarioUnidade.create({
      data: { usuario_id: macroId, unidade_id: unit1Id },
    });

    // 4. Criar Usuário 1 (USUARIO) vinculado à Unidade 1
    const user1Email = 'user1.auth64@fbest.org.br';
    const user1 = await prisma.usuario.upsert({
      where: { email: user1Email },
      update: { senha_hash: passwordHash, ativo: true },
      create: {
        id: randomUUID(),
        nome: 'Usuario 1 Unit 1',
        email: user1Email,
        senha_hash: passwordHash,
        perfil: Perfil.USUARIO,
        ativo: true,
      },
    });
    user1Id = user1.id;
    await prisma.usuarioUnidade.deleteMany({ where: { usuario_id: user1Id } });
    await prisma.usuarioUnidade.create({
      data: { usuario_id: user1Id, unidade_id: unit1Id },
    });

    // 5. Criar Usuário 2 (USUARIO) vinculado à mesma Unidade 1
    const user2Email = 'user2.auth64@fbest.org.br';
    const user2 = await prisma.usuario.upsert({
      where: { email: user2Email },
      update: { senha_hash: passwordHash, ativo: true },
      create: {
        id: randomUUID(),
        nome: 'Usuario 2 Unit 1',
        email: user2Email,
        senha_hash: passwordHash,
        perfil: Perfil.USUARIO,
        ativo: true,
      },
    });
    user2Id = user2.id;
    await prisma.usuarioUnidade.deleteMany({ where: { usuario_id: user2Id } });
    await prisma.usuarioUnidade.create({
      data: { usuario_id: user2Id, unidade_id: unit1Id },
    });

    // 6. Criar Usuário 3 (USUARIO) vinculado à Unidade 2
    const user3Email = 'user3.auth64@fbest.org.br';
    const user3 = await prisma.usuario.upsert({
      where: { email: user3Email },
      update: { senha_hash: passwordHash, ativo: true },
      create: {
        id: randomUUID(),
        nome: 'Usuario 3 Unit 2',
        email: user3Email,
        senha_hash: passwordHash,
        perfil: Perfil.USUARIO,
        ativo: true,
      },
    });
    user3Id = user3.id;
    await prisma.usuarioUnidade.deleteMany({ where: { usuario_id: user3Id } });
    await prisma.usuarioUnidade.create({
      data: { usuario_id: user3Id, unidade_id: unit2Id },
    });

    // 7. Obter Tokens JWT
    const lAdmin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, senha: defaultPassword },
    });
    adminToken = lAdmin.data.token;

    const lMacro = await api('/api/auth/login', {
      method: 'POST',
      body: { email: macroEmail, senha: defaultPassword },
    });
    macroToken = lMacro.data.token;

    const lUser1 = await api('/api/auth/login', {
      method: 'POST',
      body: { email: user1Email, senha: defaultPassword },
    });
    user1Token = lUser1.data.token;

    const lUser2 = await api('/api/auth/login', {
      method: 'POST',
      body: { email: user2Email, senha: defaultPassword },
    });
    user2Token = lUser2.data.token;

    const lUser3 = await api('/api/auth/login', {
      method: 'POST',
      body: { email: user3Email, senha: defaultPassword },
    });
    user3Token = lUser3.data.token;

    // 8. Criar Ações de Teste Diretamente no Banco
    // Ação 1: Unidade 1, criada por User 1
    const acao1 = await prisma.acoesSaep.create({
      data: {
        id: randomUUID(),
        unidade_id: unit1Id,
        unidade: unit1Nome,
        usuario_criador_id: user1Id,
        curso: 'Técnico em Eletromecânica',
        modalidade: 'Presencial',
        capacidade_saep: 'C1',
        problema_identificado: 'Problema Teste 1',
        acao: 'Ação Teste Criada por User 1',
        tipo_acao: 'Metodologia/Didática',
        responsavel_principal: 'Docente 1',
        status: 'Não iniciado',
      },
    });
    acaoUser1Id = acao1.id;

    // Ação 2: Unidade 1, criada por User 2
    const acao2 = await prisma.acoesSaep.create({
      data: {
        id: randomUUID(),
        unidade_id: unit1Id,
        unidade: unit1Nome,
        usuario_criador_id: user2Id,
        curso: 'Técnico em Logística',
        modalidade: 'Presencial',
        capacidade_saep: 'C2',
        problema_identificado: 'Problema Teste 2',
        acao: 'Ação Teste Criada por User 2',
        tipo_acao: 'Currículo/Sequência',
        responsavel_principal: 'Docente 2',
        status: 'Em andamento',
      },
    });
    acaoUser2Id = acao2.id;

    // Ação 3: Unidade 2, criada por User 3
    const acao3 = await prisma.acoesSaep.create({
      data: {
        id: randomUUID(),
        unidade_id: unit2Id,
        unidade: unit2Nome,
        usuario_criador_id: user3Id,
        curso: 'Técnico em Desenvolvimento de Sistemas',
        modalidade: 'Semipresencial',
        capacidade_saep: 'C3',
        problema_identificado: 'Problema Teste 3',
        acao: 'Ação Teste Criada por User 3',
        tipo_acao: 'Avaliação/Instrumentos',
        responsavel_principal: 'Docente 3',
        status: 'Concluído',
      },
    });
    acaoUser3Id = acao3.id;

    // Ação 4: Legada (unidade_id = NULL, usuario_criador_id = NULL, unidade = unit1Nome)
    const acao4 = await prisma.acoesSaep.create({
      data: {
        id: randomUUID(),
        unidade_id: null,
        unidade: unit1Nome,
        usuario_criador_id: null,
        curso: 'Técnico em Edificações',
        modalidade: 'Presencial',
        capacidade_saep: 'C4',
        problema_identificado: 'Problema Legado',
        acao: 'Ação Legada Sem Criador e Sem UnidadeID',
        tipo_acao: 'Infraestrutura/Suprimentos',
        responsavel_principal: 'Docente Legado',
        status: 'Não iniciado',
      },
    });
    acaoLegadaId = acao4.id;
  });

  afterAll(async () => {
    try {
      // Limpeza das ações criadas no teste
      await prisma.acoesSaep.deleteMany({
        where: {
          id: { in: [acaoUser1Id, acaoUser2Id, acaoUser3Id, acaoLegadaId] },
        },
      });

      // Limpeza dos usuários criados no teste
      await prisma.usuario.deleteMany({
        where: {
          email: {
            in: [
              'admin.auth64@fbest.org.br',
              'macro.auth64@fbest.org.br',
              'user1.auth64@fbest.org.br',
              'user2.auth64@fbest.org.br',
              'user3.auth64@fbest.org.br',
            ],
          },
        },
      });
    } catch {}

    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
  });

  // ==========================================
  // 1. AUTENTICAÇÃO OBRIGATÓRIA (401 SEM TOKEN)
  // ==========================================
  describe('1. Autenticação Obrigatória (401 sem token)', () => {
    it('GET /api/acoes sem token → 401', async () => {
      const res = await api('/api/acoes');
      expect(res.status).toBe(401);
    });

    it('GET /api/acoes/:id sem token → 401', async () => {
      const res = await api(`/api/acoes/${acaoUser1Id}`);
      expect(res.status).toBe(401);
    });

    it('POST /api/acoes sem token → 401', async () => {
      const res = await api('/api/acoes', {
        method: 'POST',
        body: { acao: 'Teste' },
      });
      expect(res.status).toBe(401);
    });

    it('PUT /api/acoes/:id sem token → 401', async () => {
      const res = await api(`/api/acoes/${acaoUser1Id}`, {
        method: 'PUT',
        body: { acao: 'Teste' },
      });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/acoes/:id sem token → 401', async () => {
      const res = await api(`/api/acoes/${acaoUser1Id}`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/chat sem token → 401', async () => {
      const res = await api('/api/chat', {
        method: 'POST',
        body: { messages: [{ role: 'user', content: 'Olá' }] },
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/ia/analyze sem token → 401', async () => {
      const res = await api('/api/ia/analyze', {
        method: 'POST',
        body: { acoes: [] },
      });
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 2. LISTAGEM ESCOPO POR PERFIL (GET /api/acoes)
  // ==========================================
  describe('2. Listagem de Ações com Escopo (GET /api/acoes)', () => {
    it('ADMIN visualiza todas as ações (Unit 1, Unit 2 e Legada)', async () => {
      const res = await api('/api/acoes', { token: adminToken });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      const ids = res.data.map((a: any) => a.id);
      expect(ids).toContain(acaoUser1Id);
      expect(ids).toContain(acaoUser2Id);
      expect(ids).toContain(acaoUser3Id);
      expect(ids).toContain(acaoLegadaId);
    });

    it('MACROPROCESSO_TECNICO visualiza ações da Unidade 1 (incluindo legada), mas não da Unidade 2', async () => {
      const res = await api('/api/acoes', { token: macroToken });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      const ids = res.data.map((a: any) => a.id);
      expect(ids).toContain(acaoUser1Id);
      expect(ids).toContain(acaoUser2Id);
      expect(ids).toContain(acaoLegadaId);
      expect(ids).not.toContain(acaoUser3Id);
    });

    it('USUARIO 1 (Unidade 1) visualiza ações da sua unidade (incluindo de terceiros e legada), mas não da Unidade 2', async () => {
      const res = await api('/api/acoes', { token: user1Token });
      expect(res.status).toBe(200);

      const ids = res.data.map((a: any) => a.id);
      expect(ids).toContain(acaoUser1Id);
      expect(ids).toContain(acaoUser2Id);
      expect(ids).toContain(acaoLegadaId);
      expect(ids).not.toContain(acaoUser3Id);
    });

    it('USUARIO 3 (Unidade 2) visualiza ações da Unidade 2, mas não da Unidade 1', async () => {
      const res = await api('/api/acoes', { token: user3Token });
      expect(res.status).toBe(200);

      const ids = res.data.map((a: any) => a.id);
      expect(ids).toContain(acaoUser3Id);
      expect(ids).not.toContain(acaoUser1Id);
      expect(ids).not.toContain(acaoUser2Id);
      expect(ids).not.toContain(acaoLegadaId);
    });
  });

  // ==========================================
  // 3. CONSULTA POR ID (GET /api/acoes/:id)
  // ==========================================
  describe('3. Consulta de Ação por ID (GET /api/acoes/:id)', () => {
    it('ADMIN pode acessar ação de qualquer unidade e ação legada', async () => {
      const r1 = await api(`/api/acoes/${acaoUser1Id}`, { token: adminToken });
      expect(r1.status).toBe(200);

      const r2 = await api(`/api/acoes/${acaoUser3Id}`, { token: adminToken });
      expect(r2.status).toBe(200);

      const r3 = await api(`/api/acoes/${acaoLegadaId}`, { token: adminToken });
      expect(r3.status).toBe(200);
    });

    it('MACROPROCESSO_TECNICO acessa ação da Unidade 1 (200), mas recebe 403 para Unidade 2', async () => {
      const r1 = await api(`/api/acoes/${acaoUser1Id}`, { token: macroToken });
      expect(r1.status).toBe(200);

      const rLeg = await api(`/api/acoes/${acaoLegadaId}`, { token: macroToken });
      expect(rLeg.status).toBe(200);

      const r2 = await api(`/api/acoes/${acaoUser3Id}`, { token: macroToken });
      expect(r2.status).toBe(403);
      expect(r2.data.error).toContain('Acesso proibido');
    });

    it('USUARIO 1 acessa ações da Unidade 1 (200), mas recebe 403 para Unidade 2', async () => {
      const r1 = await api(`/api/acoes/${acaoUser1Id}`, { token: user1Token });
      expect(r1.status).toBe(200);

      const r2 = await api(`/api/acoes/${acaoUser2Id}`, { token: user1Token });
      expect(r2.status).toBe(200);

      const rLeg = await api(`/api/acoes/${acaoLegadaId}`, { token: user1Token });
      expect(rLeg.status).toBe(200);

      const r3 = await api(`/api/acoes/${acaoUser3Id}`, { token: user1Token });
      expect(r3.status).toBe(403);
    });

    it('Retorna 404 para ID inexistente', async () => {
      const fakeId = randomUUID();
      const res = await api(`/api/acoes/${fakeId}`, { token: adminToken });
      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. CADASTRO DE AÇÕES (POST /api/acoes)
  // ==========================================
  describe('4. Cadastro de Ações (POST /api/acoes)', () => {
    let createdAcoesToClean: string[] = [];

    afterAll(async () => {
      if (createdAcoesToClean.length > 0) {
        await prisma.acoesSaep.deleteMany({
          where: { id: { in: createdAcoesToClean } },
        });
      }
    });

    it('ADMIN pode cadastrar ação em qualquer unidade ativa', async () => {
      const res = await api('/api/acoes', {
        method: 'POST',
        token: adminToken,
        body: {
          unidade: unit2Nome,
          curso: 'Técnico em Química',
          modalidade: 'Presencial',
          capacidade_saep: 'C1',
          problema_identificado: 'Problema Admin',
          acao: 'Ação Criada pelo Admin',
          tipo_acao: 'Metodologia/Didática',
          responsavel_principal: 'Admin Responsável',
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.unidade_id).toBe(unit2Id);
      expect(res.data.unidade).toBe(unit2Nome);
      expect(res.data.usuario_criador_id).toBe(adminId);
      createdAcoesToClean.push(res.data.id);
    });

    it('MACROPROCESSO_TECNICO cadastra ação em sua unidade vinculada com sucesso', async () => {
      const res = await api('/api/acoes', {
        method: 'POST',
        token: macroToken,
        body: {
          unidade: unit1Nome,
          curso: 'Técnico em Automação',
          modalidade: 'Presencial',
          capacidade_saep: 'C2',
          problema_identificado: 'Problema Macro',
          acao: 'Ação Criada por Macro',
          tipo_acao: 'Capacitação Docente',
          responsavel_principal: 'Macro Responsável',
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.unidade_id).toBe(unit1Id);
      expect(res.data.usuario_criador_id).toBe(macroId);
      createdAcoesToClean.push(res.data.id);
    });

    it('MACROPROCESSO_TECNICO tenta cadastrar em unidade NÃO vinculada → 403', async () => {
      const res = await api('/api/acoes', {
        method: 'POST',
        token: macroToken,
        body: {
          unidade: unit2Nome,
          curso: 'Técnico em Automação',
          modalidade: 'Presencial',
          capacidade_saep: 'C2',
          problema_identificado: 'Problema Inválido',
          acao: 'Ação Inválida',
          tipo_acao: 'Capacitação Docente',
          responsavel_principal: 'Macro Responsável',
        },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('permissão para cadastrar');
    });

    it('USUARIO 1 cadastra ação na sua unidade com sucesso', async () => {
      const res = await api('/api/acoes', {
        method: 'POST',
        token: user1Token,
        body: {
          unidade: unit1Nome,
          curso: 'Técnico em Administração',
          modalidade: 'Presencial',
          capacidade_saep: 'C3',
          problema_identificado: 'Problema User 1',
          acao: 'Ação Criada por User 1',
          tipo_acao: 'Gestão/Comunicação',
          responsavel_principal: 'User 1 Responsável',
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.unidade_id).toBe(unit1Id);
      expect(res.data.usuario_criador_id).toBe(user1Id);
      createdAcoesToClean.push(res.data.id);
    });

    it('USUARIO 1 tenta cadastrar em outra unidade → 403', async () => {
      const res = await api('/api/acoes', {
        method: 'POST',
        token: user1Token,
        body: {
          unidade: unit2Nome,
          curso: 'Técnico em Administração',
          modalidade: 'Presencial',
          capacidade_saep: 'C3',
          problema_identificado: 'Problema Fora',
          acao: 'Ação Fora',
          tipo_acao: 'Gestão/Comunicação',
          responsavel_principal: 'User 1 Responsável',
        },
      });

      expect(res.status).toBe(403);
    });

    it('usuario_criador_id é sempre derivado do JWT, ignorando valor forjado no body', async () => {
      const fakeCreatorId = randomUUID();
      const res = await api('/api/acoes', {
        method: 'POST',
        token: user1Token,
        body: {
          usuario_criador_id: fakeCreatorId,
          unidade: unit1Nome,
          curso: 'Técnico em Edificações',
          modalidade: 'Presencial',
          capacidade_saep: 'C1',
          problema_identificado: 'Tentativa de Forjar Criador',
          acao: 'Ação Com Injeção de Criador',
          tipo_acao: 'Metodologia/Didática',
          responsavel_principal: 'Responsável',
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.usuario_criador_id).toBe(user1Id);
      expect(res.data.usuario_criador_id).not.toBe(fakeCreatorId);
      createdAcoesToClean.push(res.data.id);
    });
  });

  // ==========================================
  // 5. EDIÇÃO DE AÇÕES (PUT /api/acoes/:id)
  // ==========================================
  describe('5. Edição de Ações (PUT /api/acoes/:id)', () => {
    it('ADMIN pode editar qualquer ação', async () => {
      const res = await api(`/api/acoes/${acaoUser3Id}`, {
        method: 'PUT',
        token: adminToken,
        body: {
          acao: 'Ação 3 Editada pelo Admin',
        },
      });

      expect(res.status).toBe(200);
      expect(res.data.acao).toBe('Ação 3 Editada pelo Admin');
    });

    it('ADMIN edita ação legada e vincula unidade_id automaticamente', async () => {
      const res = await api(`/api/acoes/${acaoLegadaId}`, {
        method: 'PUT',
        token: adminToken,
        body: {
          acao: 'Ação Legada Editada pelo Admin',
        },
      });

      expect(res.status).toBe(200);
      expect(res.data.acao).toBe('Ação Legada Editada pelo Admin');
      expect(res.data.unidade_id).toBe(unit1Id);
    });

    it('MACROPROCESSO_TECNICO edita ação da Unidade 1 com sucesso', async () => {
      const res = await api(`/api/acoes/${acaoUser1Id}`, {
        method: 'PUT',
        token: macroToken,
        body: {
          acao: 'Ação 1 Editada pelo Macro',
        },
      });

      expect(res.status).toBe(200);
      expect(res.data.acao).toBe('Ação 1 Editada pelo Macro');
    });

    it('MACROPROCESSO_TECNICO tenta editar ação da Unidade 2 → 403', async () => {
      const res = await api(`/api/acoes/${acaoUser3Id}`, {
        method: 'PUT',
        token: macroToken,
        body: {
          acao: 'Tentativa Inválida do Macro',
        },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Acesso proibido');
    });

    it('USUARIO 1 edita ação que ele próprio criou com sucesso', async () => {
      const res = await api(`/api/acoes/${acaoUser1Id}`, {
        method: 'PUT',
        token: user1Token,
        body: {
          acao: 'Ação 1 Editada pelo Próprio Criador (User 1)',
        },
      });

      expect(res.status).toBe(200);
      expect(res.data.acao).toBe('Ação 1 Editada pelo Próprio Criador (User 1)');
    });

    it('USUARIO 1 tenta editar ação de OUTRO usuário da mesma unidade → 403', async () => {
      const res = await api(`/api/acoes/${acaoUser2Id}`, {
        method: 'PUT',
        token: user1Token,
        body: {
          acao: 'Tentativa de User 1 Editar Ação de User 2',
        },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Acesso proibido');
    });

    it('USUARIO 1 tenta editar ação LEGADA (usuario_criador_id = NULL) → 403', async () => {
      const res = await api(`/api/acoes/${acaoLegadaId}`, {
        method: 'PUT',
        token: user1Token,
        body: {
          acao: 'Tentativa de User 1 Editar Ação Legada',
        },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Acesso proibido');
    });

    it('Edição não permite sobrescrever usuario_criador_id', async () => {
      const fakeId = randomUUID();
      const res = await api(`/api/acoes/${acaoUser1Id}`, {
        method: 'PUT',
        token: user1Token,
        body: {
          usuario_criador_id: fakeId,
          acao: 'Ação 1 Modificada',
        },
      });

      expect(res.status).toBe(200);
      expect(res.data.usuario_criador_id).toBe(user1Id);
      expect(res.data.usuario_criador_id).not.toBe(fakeId);
    });
  });

  // ==========================================
  // 6. EXCLUSÃO DE AÇÕES (DELETE /api/acoes/:id)
  // ==========================================
  describe('6. Exclusão de Ações (DELETE /api/acoes/:id)', () => {
    let acaoToDeleteId: string;

    beforeAll(async () => {
      const toDelete = await prisma.acoesSaep.create({
        data: {
          id: randomUUID(),
          unidade_id: unit1Id,
          unidade: unit1Nome,
          usuario_criador_id: user1Id,
          curso: 'Técnico em Eletrotécnica',
          modalidade: 'Presencial',
          capacidade_saep: 'C1',
          problema_identificado: 'Ação Para Excluir',
          acao: 'Ação Para Teste de Exclusão',
          tipo_acao: 'Metodologia/Didática',
          responsavel_principal: 'Docente',
        },
      });
      acaoToDeleteId = toDelete.id;
    });

    it('MACROPROCESSO_TECNICO tenta excluir ação → 403', async () => {
      const res = await api(`/api/acoes/${acaoToDeleteId}`, {
        method: 'DELETE',
        token: macroToken,
      });

      expect(res.status).toBe(403);
    });

    it('USUARIO tenta excluir ação → 403', async () => {
      const res = await api(`/api/acoes/${acaoToDeleteId}`, {
        method: 'DELETE',
        token: user1Token,
      });

      expect(res.status).toBe(403);
    });

    it('ADMIN exclui ação com sucesso → 204', async () => {
      const res = await api(`/api/acoes/${acaoToDeleteId}`, {
        method: 'DELETE',
        token: adminToken,
      });

      expect(res.status).toBe(204);

      // Confirma que não existe mais no banco
      const check = await prisma.acoesSaep.findUnique({
        where: { id: acaoToDeleteId },
      });
      expect(check).toBeNull();
    });
  });

  // ==========================================
  // 7. CHAT IA (/api/chat)
  // ==========================================
  describe('7. Proteção do Chat IA (/api/chat)', () => {
    it('USUARIO recebe 403 ao tentar acessar o Chat IA', async () => {
      const res = await api('/api/chat', {
        method: 'POST',
        token: user1Token,
        body: { messages: [{ role: 'user', content: 'Pergunta' }] },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Acesso proibido');
    });

    it('ADMIN tem permissão para acessar o Chat IA (passa pela autorização)', async () => {
      // Enviando payload com formato inválido para testar que atingiu o controller (400) e não foi barrado no middleware (403/401)
      const res = await api('/api/chat', {
        method: 'POST',
        token: adminToken,
        body: { messages: [] },
      });

      // 400 indica que a autorização passou e o handler do controller validou o corpo
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('messages array is required');
    });

    it('MACROPROCESSO_TECNICO tem permissão para acessar o Chat IA (passa pela autorização)', async () => {
      const res = await api('/api/chat', {
        method: 'POST',
        token: macroToken,
        body: { messages: [] },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('messages array is required');
    });
  });

  // ==========================================
  // 8. ANÁLISE IA (/api/ia/analyze)
  // ==========================================
  describe('8. Proteção da Análise IA (/api/ia/analyze)', () => {
    it('USUARIO recebe 403 ao tentar acessar a Análise IA', async () => {
      const res = await api('/api/ia/analyze', {
        method: 'POST',
        token: user1Token,
        body: { acoes: [{ id: '1' }] },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('Acesso proibido');
    });

    it('ADMIN tem permissão para acessar a Análise IA (passa pela autorização)', async () => {
      const res = await api('/api/ia/analyze', {
        method: 'POST',
        token: adminToken,
        body: { acoes: [] },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('acoes array is required');
    });

    it('MACROPROCESSO_TECNICO tem permissão para acessar a Análise IA (passa pela autorização)', async () => {
      const res = await api('/api/ia/analyze', {
        method: 'POST',
        token: macroToken,
        body: { acoes: [] },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('acoes array is required');
    });
  });
});
