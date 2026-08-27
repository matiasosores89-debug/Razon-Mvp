import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Seeding database...');

    // Clear existing data to avoid duplicates
    await prisma.appointment.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.service.deleteMany();
    await prisma.barber.deleteMany();

    // Seed Barbers
    const barbers = [
      {
        name: "Marco 'The Blade' Rossi",
        specialty: "Corte Clásico & Navaja",
        experience: 12,
        image: "/barbero1.jpg",
      },
      {
        name: "Julian Vance",
        specialty: "Diseño de Barba & Fade",
        experience: 8,
        image: "/barbero2.jpg",
      },
      {
        name: "Santi Mendez",
        specialty: "Estilo Moderno & Color",
        experience: 6,
        image: "/barbero3.jpg",
      },
      {
        name: "Leo Sterling",
        specialty: "Técnicas Avanzadas",
        experience: 15,
        image: "/barbero4.jpg",
      },
    ];

    for (const barber of barbers) {
      await prisma.barber.create({ data: barber });
    }

    // Seed Services
    const services = [
      {
        title: "Corte de pelo",
        description: "Corte personalizado según la fisionomía facial, incluye lavado y acabado con productos premium.",
        price: 12000,
        duration: 30,
      },
      {
        title: "Corte de pelo + barba",
        description: "La experiencia completa: corte de cabello personalizado y ritual de barba con toalla caliente y navaja.",
        price: 15000,
        duration: 45,
      },
    ];

    for (const service of services) {
      await prisma.service.create({ data: service });
    }

    console.log('Seeding completed successfully!');
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
