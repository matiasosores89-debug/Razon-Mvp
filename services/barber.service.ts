import { prisma } from "@/lib/prisma";
import { BarberSchema } from "@/lib/validations";

export const BarberService = {
  /**
   * Lists all barbers for the public website and booking flow.
   */
  async getAll() {
    return await prisma.barber.findMany({
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Creates a new barber.
   */
  async create(data: unknown) {
    const validated = BarberSchema.parse(data);
    return await prisma.barber.create({
      data: validated,
    });
  },

  /**
   * Lists all barbers with their completed appointment count for today.
   */
  async getBarbersWithStats() {
    const barbers = await prisma.barber.findMany({
      orderBy: { name: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const barbersWithStats = await Promise.all(
      barbers.map(async (barber) => {
        const completedToday = await prisma.appointment.count({
          where: {
            barberId: barber.id,
            status: "COMPLETED",
            startTime: { gte: today },
          },
        });
        return { ...barber, completedToday };
      })
    );

    return barbersWithStats;
  },

  /**
   * Retrieves a barber by ID.
   */
  async getById(id: string) {
    return await prisma.barber.findUnique({
      where: { id },
    });
  },

  /**
   * Retrieves detailed stats and history for a barber, optionally filtered by month/year.
   */
  async getBarberDetails(id: string, month?: number, year?: number) {
    const barber = await this.getById(id);
    if (!barber) throw new Error("Barber not found");

    let startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);
    startTime.setHours(0, 0, 0, 0);

    if (month !== undefined && year !== undefined) {
      startTime = new Date(year, month - 1, 1);
      const endTime = new Date(year, month, 0, 23, 59, 59, 999);

      const appointments = await prisma.appointment.findMany({
        where: {
          barberId: id,
          startTime: { gte: startTime, lte: endTime },
        },
        include: {
          customer: true,
          service: true,
        },
        orderBy: { startTime: 'desc' },
      });

      const statsByDay: Record<string, number> = {};
      appointments.forEach((app) => {
        const date = app.startTime.toISOString().split('T')[0];
        statsByDay[date] = (statsByDay[date] || 0) + 1;
      });

      return {
        barber,
        history: appointments,
        statsByDay,
        totalCompleted: appointments.filter(a => a.status === 'COMPLETED').length,
        totalAppointments: appointments.length,
        filterActive: true,
        period: { month, year }
      };
    }

    startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);
    startTime.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: id,
        startTime: { gte: startTime },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const statsByDay: Record<string, number> = {};
    appointments.forEach((app) => {
      const date = app.startTime.toISOString().split('T')[0];
      statsByDay[date] = (statsByDay[date] || 0) + 1;
    });

    return {
      barber,
      history: appointments,
      statsByDay,
      totalCompleted: appointments.filter(a => a.status === 'COMPLETED').length,
      totalAppointments: appointments.length,
      filterActive: false,
    };
  },

  /**
   * Updates a barber.
   */
  async update(id: string, data: unknown) {
    const validated = BarberSchema.partial().parse(data);
    return await prisma.barber.update({
      where: { id },
      data: validated,
    });
  },

  /**
   * Deletes a barber.
   */
  async delete(id: string) {
    return await prisma.barber.delete({
      where: { id },
    });
  },
};
