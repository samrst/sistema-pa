import fs from 'fs';
import path from 'path';
import { PrismaClient, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const UNIDADES_OFICIAIS = [
  'Geral',
  'SENAI Alagoinhas',
  'SENAI Barreiras',
  'SENAI Camaçari',
  'SENAI CIMATEC',
  'SENAI Dendezeiros',
  'SENAI Feira de Santana',
  'SENAI Ilhéus',
  'SENAI Juazeiro',
  'SENAI Lauro de Freitas',
  'SENAI Luís Eduardo Magalhães',
  'SENAI Vitória da Conquista',
  'SENAI Teixeira de Freitas',
] as const;

async function main() {
  console.log('=== Executando configuração do banco de dados (db-setup - Phase 6.2) ===');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('1. Conexão com MariaDB estabelecida com sucesso.');

    // 1. Criação das tabelas base (usuarios, unidades, usuario_unidades, acoes_saep)
    console.log('2. Verificando e criando tabelas base...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`usuarios\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`nome\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL UNIQUE,
        \`senha_hash\` VARCHAR(255) NOT NULL,
        \`perfil\` ENUM('ADMIN', 'MACROPROCESSO_TECNICO', 'USUARIO') NOT NULL,
        \`ativo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`unidades\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`nome\` VARCHAR(150) NOT NULL UNIQUE,
        \`codigo\` VARCHAR(50) DEFAULT NULL UNIQUE,
        \`ativo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`usuario_unidades\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`usuario_id\` CHAR(36) NOT NULL,
        \`unidade_id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE KEY \`uk_usuario_unidade\` (\`usuario_id\`, \`unidade_id\`),
        INDEX \`idx_usuario_unidades_usuario\` (\`usuario_id\`),
        INDEX \`idx_usuario_unidades_unidade\` (\`unidade_id\`),
        CONSTRAINT \`fk_usuario_unidades_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_usuario_unidades_unidade\` FOREIGN KEY (\`unidade_id\`) REFERENCES \`unidades\` (\`id\`) ON DELETE CASCADE
      ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`acoes_saep\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

        \`unidade_id\` CHAR(36) DEFAULT NULL,
        \`usuario_criador_id\` CHAR(36) DEFAULT NULL,

        \`unidade\` TEXT NOT NULL,
        \`curso\` TEXT NOT NULL,
        \`modalidade\` TEXT NOT NULL,
        \`capacidade_saep\` TEXT NOT NULL,

        \`problema_identificado\` TEXT NOT NULL,
        \`evidencias\` TEXT DEFAULT NULL,
        \`classificacao_criticidade\` TEXT DEFAULT 'Adequado',

        \`meta_objetiva\` TEXT DEFAULT NULL,
        \`meta_pratica\` TEXT DEFAULT NULL,
        \`meta_prazo\` DATE DEFAULT NULL,

        \`acao\` TEXT NOT NULL,
        \`tipo_acao\` TEXT NOT NULL,
        \`entregavel\` TEXT DEFAULT NULL,

        \`responsavel_principal\` TEXT NOT NULL,
        \`funcao_cargo\` TEXT DEFAULT NULL,
        \`co_responsaveis\` TEXT DEFAULT NULL,
        \`apoios_necessarios\` JSON DEFAULT NULL,

        \`data_inicio\` DATE DEFAULT NULL,
        \`data_fim\` DATE DEFAULT NULL,

        \`status\` TEXT DEFAULT 'Não iniciado',
        \`risco\` TEXT DEFAULT 'Baixo',
        \`plano_mitigacao\` TEXT DEFAULT NULL,
        \`custo_estimado\` DECIMAL(12,2) DEFAULT NULL,
        \`prioridade\` TEXT DEFAULT 'Média',
        \`impacto_saep\` TEXT DEFAULT 'Médio',
        \`observacoes\` TEXT DEFAULT NULL,

        INDEX \`idx_acoes_saep_unidade_id\` (\`unidade_id\`),
        INDEX \`idx_acoes_saep_usuario_criador_id\` (\`usuario_criador_id\`),
        CONSTRAINT \`fk_acoes_saep_unidade\` FOREIGN KEY (\`unidade_id\`) REFERENCES \`unidades\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_acoes_saep_usuario_criador\` FOREIGN KEY (\`usuario_criador_id\` ) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL
      ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
    `);

    // 2. Garantir que as colunas unidade_id e usuario_criador_id existam em acoes_saep existente
    console.log('3. Verificando compatibilidade e colunas em acoes_saep...');
    const columns: any[] = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM `acoes_saep`");
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('unidade_id')) {
      console.log('   -> Adicionando coluna unidade_id em acoes_saep...');
      await prisma.$executeRawUnsafe("ALTER TABLE `acoes_saep` ADD COLUMN `unidade_id` CHAR(36) DEFAULT NULL AFTER `updated_at`");
      await prisma.$executeRawUnsafe("ALTER TABLE `acoes_saep` ADD INDEX `idx_acoes_saep_unidade_id` (`unidade_id`)");
      try {
        await prisma.$executeRawUnsafe("ALTER TABLE `acoes_saep` ADD CONSTRAINT `fk_acoes_saep_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE SET NULL");
      } catch {}
    }

    if (!columnNames.includes('usuario_criador_id')) {
      console.log('   -> Adicionando coluna usuario_criador_id em acoes_saep...');
      await prisma.$executeRawUnsafe("ALTER TABLE `acoes_saep` ADD COLUMN `usuario_criador_id` CHAR(36) DEFAULT NULL AFTER `unidade_id`");
      await prisma.$executeRawUnsafe("ALTER TABLE `acoes_saep` ADD INDEX `idx_acoes_saep_usuario_criador_id` (`usuario_criador_id`)");
      try {
        await prisma.$executeRawUnsafe("ALTER TABLE `acoes_saep` ADD CONSTRAINT `fk_acoes_saep_usuario_criador` FOREIGN KEY (`usuario_criador_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL");
      } catch {}
    }

    // 3. Seed das 13 Unidades Oficiais
    console.log('4. Executando seed idempotente das 13 unidades oficiais...');
    for (const nomeUnidade of UNIDADES_OFICIAIS) {
      await prisma.unidade.upsert({
        where: { nome: nomeUnidade },
        update: {},
        create: {
          id: randomUUID(),
          nome: nomeUnidade,
          ativo: true,
        },
      });
    }
    const totalUnidades = await prisma.unidade.count();
    console.log(`   -> Total de unidades no banco: ${totalUnidades} (Esperado: 13)`);

    // 4. Seed do Usuário ADMIN Inicial
    console.log('5. Verificando existência de usuário ADMIN inicial...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fbest.org.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'SAEP2026';

    const existingAdmin = await prisma.usuario.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      console.log(`   -> Criando usuário ADMIN inicial (${adminEmail})...`);
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(adminPassword, saltRounds);

      await prisma.usuario.create({
        data: {
          id: randomUUID(),
          nome: 'Administrador do Sistema',
          email: adminEmail,
          senha_hash: senhaHash,
          perfil: Perfil.ADMIN,
          ativo: true,
        },
      });
      console.log('   -> Usuário ADMIN inicial cadastrado com sucesso.');
    } else {
      console.log(`   -> Usuário ADMIN inicial já existe (${existingAdmin.email}).`);
    }

    // 5. Verificações Finais
    const tables: any = await prisma.$queryRawUnsafe('SHOW TABLES');
    console.log('6. Tabelas ativas no MariaDB:', tables);

    const totalAcoes = await prisma.acoesSaep.count();
    console.log(`7. Total de ações persistidas em acoes_saep: ${totalAcoes}`);

    const totalUsuarios = await prisma.usuario.count();
    console.log(`8. Total de usuários cadastrados: ${totalUsuarios}`);

    console.log('=== Configuração db-setup finalizada com sucesso ===');
  } catch (err: any) {
    console.error('Erro ao configurar banco de dados:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
