import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function check() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const barbers = await prisma.barber.findMany();
  console.log("Barbers in DB:", JSON.stringify(barbers, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
