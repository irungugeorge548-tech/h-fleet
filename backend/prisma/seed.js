const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const pin = await bcrypt.hash('1234', 10);
  await prisma.user.upsert({
    where: { phone: '0712345678' },
    update: {},
    create: { name: 'Rider Demo', phone: '0712345678', password, pin, role: 'RIDER' }
  });
  console.log('H-Fleet seeded');
}
main().finally(() => prisma.$disconnect());
