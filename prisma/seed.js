const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos...');

  // 1. Crear Admin (Si no existe)
  const adminExists = await prisma.admin.findUnique({ where: { username: 'admin' } });

  if (!adminExists) {
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: '123' // <--- TU CONTRASEÑA DE ACCESO
      }
    });
    console.log('👤 Admin creado (Usuario: admin / Pass: 123)');
  }

  // (Aquí puedes dejar el código de crear productos si quieres, o borrarlo si ya tienes datos)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());