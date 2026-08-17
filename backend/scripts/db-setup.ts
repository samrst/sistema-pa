import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('--- Executando configuração do banco de dados (db-setup) ---');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('1. Conexão com MariaDB estabelecida com sucesso.');

    const ddlPath = path.join(__dirname, '..', 'prisma', 'ddl_mariadb_acoes_saep.sql');
    if (!fs.existsSync(ddlPath)) {
      throw new Error(`Arquivo DDL não encontrado em: ${ddlPath}`);
    }

    const ddlContent = fs.readFileSync(ddlPath, 'utf-8');
    // Remove single line comments
    let createTableSql = ddlContent.replace(/--.*$/gm, '').trim();

    // Ensure CREATE TABLE IF NOT EXISTS is used for idempotency
    if (!createTableSql.includes('CREATE TABLE IF NOT EXISTS')) {
      createTableSql = createTableSql.replace(/CREATE\s+TABLE\s+`?acoes_saep`?/i, 'CREATE TABLE IF NOT EXISTS `acoes_saep`');
    }

    console.log('2. Executando DDL para criação da tabela acoes_saep...');
    await prisma.$executeRawUnsafe(createTableSql);
    console.log('3. Tabela acoes_saep configurada com sucesso.');

    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log('4. Tabelas ativas no banco:', tables);
  } catch (err: any) {
    console.error('Erro ao configurar banco de dados:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('--- db-setup finalizado ---');
  }
}

main();
