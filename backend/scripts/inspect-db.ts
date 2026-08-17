import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    
    console.log('=== SHOW TABLES ===');
    const tables: any = await prisma.$queryRawUnsafe('SHOW TABLES');
    console.log(JSON.stringify(tables, null, 2));

    console.log('\n=== DESCRIBE usuarios ===');
    const descUsuarios: any = await prisma.$queryRawUnsafe('DESCRIBE usuarios');
    console.log(JSON.stringify(descUsuarios, null, 2));

    console.log('\n=== DESCRIBE unidades ===');
    const descUnidades: any = await prisma.$queryRawUnsafe('DESCRIBE unidades');
    console.log(JSON.stringify(descUnidades, null, 2));

    console.log('\n=== DESCRIBE usuario_unidades ===');
    const descUsuarioUnidades: any = await prisma.$queryRawUnsafe('DESCRIBE usuario_unidades');
    console.log(JSON.stringify(descUsuarioUnidades, null, 2));

    console.log('\n=== DESCRIBE acoes_saep ===');
    const descAcoes: any = await prisma.$queryRawUnsafe('DESCRIBE acoes_saep');
    console.log(JSON.stringify(descAcoes, null, 2));

    console.log('\n=== SELECT * FROM unidades ===');
    const unidades = await prisma.unidade.findMany({ orderBy: { nome: 'asc' } });
    console.log(JSON.stringify(unidades, null, 2));

    console.log('\n=== SELECT id, nome, email, perfil, ativo FROM usuarios ===');
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        created_at: true,
        updated_at: true,
      },
    });
    console.log(JSON.stringify(usuarios, null, 2));

    console.log('\n=== CONTAGEM E DADOS DE acoes_saep DEPOIS ===');
    const acoes = await prisma.acoesSaep.findMany();
    console.log('Total:', acoes.length);
    console.log(JSON.stringify(acoes, null, 2));

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
