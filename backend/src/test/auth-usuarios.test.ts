import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import buildServer from '../server';
import { PrismaClient, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('PHASE 6.3 — Autenticação JWT, Unidades e Gestão de Usuários', () => {
  let app: any;
  let baseUrl: string;
  let prisma: PrismaClient;
  let adminToken: string;
  let macroToken: string;
  let userToken: string;

  let testUnidade1Id: string;
  let testUnidade2Id: string;
  let testMacroId: string;
  let testUserId: string;

  async function api(path: string, options: { method?: string; body?: any; token?: string } = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
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
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-phase-6-3';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://sistema_pa:saep@localhost:3306/sistema_pa';

    app = await buildServer();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const port = (app.server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    prisma = new PrismaClient();
    await prisma.$connect();

    // 1. Obter 2 unidades existentes
    const unidades = await prisma.unidade.findMany({ take: 2, orderBy: { nome: 'asc' } });
    testUnidade1Id = unidades[0].id;
    testUnidade2Id = unidades[1].id;

    // 2. Garantir usuário ADMIN para teste
    const adminEmail = 'admin@fbest.org.br';
    const adminPass = 'SAEP2026';
    const adminHash = await bcrypt.hash(adminPass, 10);

    await prisma.usuario.upsert({
      where: { email: adminEmail },
      update: { senha_hash: adminHash, ativo: true },
      create: {
        nome: 'Administrador do Sistema',
        email: adminEmail,
        senha_hash: adminHash,
        perfil: Perfil.ADMIN,
        ativo: true,
      },
    });

    // 3. Criar usuário inativo para teste
    const inativoHash = await bcrypt.hash('Senha123', 10);
    await prisma.usuario.upsert({
      where: { email: 'inativo.teste@fbest.org.br' },
      update: { ativo: false, senha_hash: inativoHash },
      create: {
        nome: 'Usuário Inativo Teste',
        email: 'inativo.teste@fbest.org.br',
        senha_hash: inativoHash,
        perfil: Perfil.USUARIO,
        ativo: false,
      },
    });

    // 4. Criar usuário MACROPROCESSO_TECNICO para teste
    const macroHash = await bcrypt.hash('MacroPass123', 10);
    const macro = await prisma.usuario.upsert({
      where: { email: 'macro.teste@fbest.org.br' },
      update: { senha_hash: macroHash, ativo: true },
      create: {
        nome: 'Macroprocesso Teste',
        email: 'macro.teste@fbest.org.br',
        senha_hash: macroHash,
        perfil: Perfil.MACROPROCESSO_TECNICO,
        ativo: true,
      },
    });
    testMacroId = macro.id;

    // Vincular 2 unidades ao Macroprocesso
    await prisma.usuarioUnidade.deleteMany({ where: { usuario_id: testMacroId } });
    await prisma.usuarioUnidade.createMany({
      data: [
        { usuario_id: testMacroId, unidade_id: testUnidade1Id },
        { usuario_id: testMacroId, unidade_id: testUnidade2Id },
      ],
    });

    // 5. Criar usuário USUARIO para teste
    const userHash = await bcrypt.hash('UserPass123', 10);
    const user = await prisma.usuario.upsert({
      where: { email: 'user.teste@fbest.org.br' },
      update: { senha_hash: userHash, ativo: true },
      create: {
        nome: 'Usuário Comum Teste',
        email: 'user.teste@fbest.org.br',
        senha_hash: userHash,
        perfil: Perfil.USUARIO,
        ativo: true,
      },
    });
    testUserId = user.id;

    // Vincular 1 unidade ao Usuário Comum
    await prisma.usuarioUnidade.deleteMany({ where: { usuario_id: testUserId } });
    await prisma.usuarioUnidade.create({
      data: { usuario_id: testUserId, unidade_id: testUnidade1Id },
    });

    // 6. Obter tokens reais
    const loginAdmin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, senha: adminPass },
    });
    adminToken = loginAdmin.data.token;

    const loginMacro = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'macro.teste@fbest.org.br', senha: 'MacroPass123' },
    });
    macroToken = loginMacro.data.token;

    const loginUser = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'user.teste@fbest.org.br', senha: 'UserPass123' },
    });
    userToken = loginUser.data.token;
  });

  afterAll(async () => {
    try {
      await prisma.usuario.deleteMany({
        where: {
          email: {
            in: [
              'inativo.teste@fbest.org.br',
              'macro.teste@fbest.org.br',
              'user.teste@fbest.org.br',
              'novo.usuario.unit@fbest.org.br',
              'novo.macro.unit@fbest.org.br',
              'novo.macro.multi@fbest.org.br',
              'novo.user.fail0@fbest.org.br',
              'novo.user.fail2@fbest.org.br',
              'novo.macro.zero@fbest.org.br',
            ],
          },
        },
      });
    } catch {}

    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
  });

  // ==========================================
  // 1. LOGIN
  // ==========================================
  describe('Testes de Login (/api/auth/login)', () => {
    it('1. login ADMIN válido → 200 com token e dados do usuário', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@fbest.org.br', senha: 'SAEP2026' },
      });

      expect(res.status).toBe(200);
      expect(res.data.token).toBeDefined();
      expect(res.data.usuario.email).toBe('admin@fbest.org.br');
      expect(res.data.usuario.perfil).toBe('ADMIN');
    });

    it('2. email inexistente → 401 com mensagem genérica', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'naoexiste@fbest.org.br', senha: 'qualquersenha' },
      });

      expect(res.status).toBe(401);
      expect(res.data.error).toBe('Credenciais inválidas.');
    });

    it('3. senha incorreta → 401 com mensagem genérica', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@fbest.org.br', senha: 'senha_totalmente_errada' },
      });

      expect(res.status).toBe(401);
      expect(res.data.error).toBe('Credenciais inválidas.');
    });

    it('4. usuário inativo → 403', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'inativo.teste@fbest.org.br', senha: 'Senha123' },
      });

      expect(res.status).toBe(403);
      expect(res.data.error).toContain('inativo');
    });

    it('5. resposta de login NÃO contém senha nem senha_hash', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@fbest.org.br', senha: 'SAEP2026' },
      });

      expect(res.data.senha).toBeUndefined();
      expect(res.data.senha_hash).toBeUndefined();
      expect(res.data.usuario.senha).toBeUndefined();
      expect(res.data.usuario.senha_hash).toBeUndefined();
    });
  });

  // ==========================================
  // 2. JWT & /api/auth/me
  // ==========================================
  describe('Testes de JWT e /api/auth/me', () => {
    it('6. /api/auth/me sem token → 401', async () => {
      const res = await api('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('7. /api/auth/me com token inválido → 401', async () => {
      const res = await api('/api/auth/me', { token: 'token_totalmente_invalido.123.456' });
      expect(res.status).toBe(401);
    });

    it('8. /api/auth/me com token válido → 200', async () => {
      const res = await api('/api/auth/me', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.data.usuario.email).toBe('admin@fbest.org.br');
      expect(res.data.usuario.perfil).toBe('ADMIN');
      expect(res.data.usuario.senha_hash).toBeUndefined();
    });

    it('9. /api/auth/me consulta o banco e reflete dados atuais e unidades vinculadas', async () => {
      const res = await api('/api/auth/me', { token: macroToken });
      expect(res.status).toBe(200);
      expect(res.data.usuario.email).toBe('macro.teste@fbest.org.br');
      expect(res.data.usuario.perfil).toBe('MACROPROCESSO_TECNICO');
      expect(res.data.usuario.unidades.length).toBe(2);
      expect(res.data.usuario.unidades[0].nome).toBeDefined();
    });
  });

  // ==========================================
  // 3. GESTÃO DE USUÁRIOS E AUTORIZAÇÃO
  // ==========================================
  describe('Testes de Permissões e Gestão de Usuários (/api/usuarios)', () => {
    it('10. GET /api/usuarios sem token → 401', async () => {
      const res = await api('/api/usuarios');
      expect(res.status).toBe(401);
    });

    it('11. GET /api/usuarios com perfil USUARIO → 403', async () => {
      const res = await api('/api/usuarios', { token: userToken });
      expect(res.status).toBe(403);
    });

    it('12. GET /api/usuarios com perfil MACROPROCESSO_TECNICO → 403', async () => {
      const res = await api('/api/usuarios', { token: macroToken });
      expect(res.status).toBe(403);
    });

    it('13. GET /api/usuarios com perfil ADMIN → 200', async () => {
      const res = await api('/api/usuarios', { token: adminToken });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].senha_hash).toBeUndefined();
      expect(res.data[0].unidades).toBeDefined();
    });

    it('14. criação de usuário USUARIO com exatamente uma unidade → sucesso 201', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Novo Usuário Teste',
          email: 'novo.usuario.unit@fbest.org.br',
          senha: 'Password123',
          perfil: 'USUARIO',
          unidades_ids: [testUnidade1Id],
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.email).toBe('novo.usuario.unit@fbest.org.br');
      expect(res.data.unidades.length).toBe(1);
      expect(res.data.senha_hash).toBeUndefined();
    });

    it('15. criação de usuário USUARIO com zero unidades → rejeitado 400', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Usuário Sem Unidade',
          email: 'novo.user.fail0@fbest.org.br',
          senha: 'Password123',
          perfil: 'USUARIO',
          unidades_ids: [],
        },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('exatamente uma unidade');
    });

    it('16. criação de usuário USUARIO com duas unidades → rejeitado 400', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Usuário Duas Unidades',
          email: 'novo.user.fail2@fbest.org.br',
          senha: 'Password123',
          perfil: 'USUARIO',
          unidades_ids: [testUnidade1Id, testUnidade2Id],
        },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('exatamente uma unidade');
    });

    it('17. criação de MACROPROCESSO_TECNICO com uma unidade → sucesso 201', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Macro 1 Unidade',
          email: 'novo.macro.unit@fbest.org.br',
          senha: 'Password123',
          perfil: 'MACROPROCESSO_TECNICO',
          unidades_ids: [testUnidade1Id],
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.unidades.length).toBe(1);
    });

    it('18. criação de MACROPROCESSO_TECNICO com múltiplas unidades → sucesso 201', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Macro Multi Unidades',
          email: 'novo.macro.multi@fbest.org.br',
          senha: 'Password123',
          perfil: 'MACROPROCESSO_TECNICO',
          unidades_ids: [testUnidade1Id, testUnidade2Id],
        },
      });

      expect(res.status).toBe(201);
      expect(res.data.unidades.length).toBe(2);
    });

    it('19. criação de MACROPROCESSO_TECNICO sem unidade → rejeitado 400', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Macro Zero Unidades',
          email: 'novo.macro.zero@fbest.org.br',
          senha: 'Password123',
          perfil: 'MACROPROCESSO_TECNICO',
          unidades_ids: [],
        },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('pelo menos uma unidade');
    });

    it('20. criação com e-mail duplicado → rejeitado 400', async () => {
      const res = await api('/api/usuarios', {
        method: 'POST',
        token: adminToken,
        body: {
          nome: 'Duplicado',
          email: 'admin@fbest.org.br',
          senha: 'Password123',
          perfil: 'ADMIN',
          unidades_ids: [],
        },
      });

      expect(res.status).toBe(400);
      expect(res.data.error).toBe('E-mail já cadastrado.');
    });

    it('21. senha é armazenada apenas como bcrypt hash no banco', async () => {
      const dbUser = await prisma.usuario.findUnique({
        where: { email: 'admin@fbest.org.br' },
      });

      expect(dbUser?.senha_hash).toBeDefined();
      expect(dbUser?.senha_hash.startsWith('$2')).toBe(true);
      expect(dbUser?.senha_hash).not.toBe('SAEP2026');
    });

    it('GET /api/usuarios/:id e PUT /api/usuarios/:id funcionam para ADMIN', async () => {
      // 1. GET /:id
      const getRes = await api(`/api/usuarios/${testUserId}`, { token: adminToken });
      expect(getRes.status).toBe(200);
      expect(getRes.data.id).toBe(testUserId);
      expect(getRes.data.senha_hash).toBeUndefined();

      // 2. PUT /:id (atualizar nome e manter 1 unidade)
      const putRes = await api(`/api/usuarios/${testUserId}`, {
        method: 'PUT',
        token: adminToken,
        body: {
          nome: 'Usuário Comum Nome Alterado',
          unidades_ids: [testUnidade2Id],
        },
      });
      expect(putRes.status).toBe(200);
      expect(putRes.data.nome).toBe('Usuário Comum Nome Alterado');
      expect(putRes.data.unidades[0].id).toBe(testUnidade2Id);

      // 3. PUT /:id/senha
      const senhaRes = await api(`/api/usuarios/${testUserId}/senha`, {
        method: 'PUT',
        token: adminToken,
        body: { senha: 'NovaSenhaSegura123' },
      });
      expect(senhaRes.status).toBe(200);

      // 4. Testar login com a nova senha
      const testLogin = await api('/api/auth/login', {
        method: 'POST',
        body: { email: 'user.teste@fbest.org.br', senha: 'NovaSenhaSegura123' },
      });
      expect(testLogin.status).toBe(200);
    });
  });

  // ==========================================
  // 4. UNIDADES
  // ==========================================
  describe('Testes de Unidades (/api/unidades)', () => {
    it('22. GET /api/unidades → 200', async () => {
      const res = await api('/api/unidades');
      expect(res.status).toBe(200);
    });

    it('23. GET /api/unidades retorna exatamente as 13 unidades ativas cadastradas', async () => {
      const res = await api('/api/unidades');
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBe(13);
      expect(res.data.every((u: any) => u.ativo === true)).toBe(true);
      const nomes = res.data.map((u: any) => u.nome);
      expect(nomes).toContain('Geral');
      expect(nomes).toContain('SENAI CIMATEC');
      expect(nomes).toContain('SENAI Feira de Santana');
    });
  });
});
