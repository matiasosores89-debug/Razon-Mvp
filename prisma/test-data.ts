import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🚀 Generando datos de prueba para el gráfico de actividad...');

  // 1. Asegurar que tenemos datos básicos
  const barbers = await prisma.barber.findMany();
  const services = await prisma.service.findMany();

  if (barbers.length === 0 || services.length === 0) {
    console.error('❌ Error: No hay barberos o servicios en la DB. Ejecuta npm run seed primero.');
    return;
  }

  // 2. Crear clientes ficticios
  const dummyCustomers = [
    { name: "Cliente Test 1", phone: "123456789", email: "test1@gmail.com" },
    { name: "Cliente Test 2", phone: "234567890", email: "test2@gmail.com" },
    { name: "Cliente Test 3", phone: "345678901", email: "test3@gmail.com" },
    { name: "Cliente Test 4", phone: "456789012", email: "test4@gmail.com" },
    { name: "Cliente Test 5", phone: "567890123", email: "test5@gmail.com" },
  ];

  const createdCustomers = [];
  for (const c of dummyCustomers) {
    const customer = await prisma.customer.create({ data: c });
    createdCustomers.push(customer);
  }

  // 3. Generar turnos distribuidos en los últimos 30 días
  const appointments = [];
  const daysToGenerate = 30;
  const appointmentsPerDay = 3; // Promedio

  for (let i = 0; i < daysToGenerate; i++) {
    // Elegir cuántos turnos habrá este día (aleatorio entre 0 y 6)
    const countForDay = Math.floor(Math.random() * 7);

    for (let j = 0; j < countForDay; j++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 4) * 15, 0, 0);

      const barber = barbers[Math.floor(Math.random() * barbers.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];

      // Estado aleatorio
      const statuses: any[] = ["SCHEDULED", "COMPLETED", "COMPLETED", "CANCELLED", "NO_SHOW"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const endTime = new Date(date.getTime() + service.duration * 60000);

      appointments.push({
        barberId: barber.id,
        customerId: customer.id,
        serviceId: service.id,
        startTime: date,
        endTime: endTime,
        status: status,
      });
    }
  }

  await prisma.appointment.createMany({
    data: appointments,
  });

  console.log(`✅ ¡Éxito! Se han generado ${appointments.length} turnos distribuidos en los últimos 30 días.`);
  console.log('📈 Ahora revisa tu Dashboard de Admin para ver el gráfico actualizado.');
}

main()
  .catch(console.error)
  .finally(async () => {
    // No hay pool.end() directo en PrismaClient, pero cerramos el proceso
    process.exit(0);
  });
