import { prisma } from "@/lib/prisma";
import { BarberSchema } from "@/lib/validations";
import { getShopDateString, getShopDayBounds, shopDateTime } from "@/lib/datetime";

export const BarberService = {
  /**
   * Lists all barbers for the public website and booking flow.
   */
  async getAll() {
    return await prisma.barber.findMany({
      where: { isActive: true },
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
      include: { _count: { select: { appointments: true } } },
      orderBy: { name: 'asc' },
    });

    const { start: today } = getShopDayBounds(getShopDateString());

    const barbersWithStats = await Promise.all(
      barbers.map(async (barber) => {
        const completedToday = await prisma.appointment.count({
          where: {
            barberId: barber.id,
            status: "COMPLETED",
            startTime: { gte: today },
          },
        });
        return { ...barber, completedToday, totalAppointments: barber._count.appointments };
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

    const nowParts = getShopDateString().split("-").map(Number);
    const selectedMonth = month ?? nowParts[1];
    const selectedYear = year ?? nowParts[0];

    if (selectedMonth < 1 || selectedMonth > 12 || selectedYear < 2000 || selectedYear > 2100) {
      throw new Error("Periodo inválido");
    }

    const startTime = shopDateTime(
      `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
      "00:00"
    );
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextMonthYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const endTime = shopDateTime(
      `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`,
      "00:00"
    );

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: id,
        startTime: { gte: startTime, lt: endTime },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const statsByDay: Record<string, number> = {};
    const completedAppointments = appointments.filter((appointment) => appointment.status === "COMPLETED");

    completedAppointments.forEach((app) => {
      const date = getShopDateString(app.startTime);
      statsByDay[date] = (statsByDay[date] || 0) + 1;
    });

    const servicesMap = new Map<string, { serviceId: string; title: string; count: number }>();
    completedAppointments.forEach((appointment) => {
      const current = servicesMap.get(appointment.serviceId);
      servicesMap.set(appointment.serviceId, {
        serviceId: appointment.serviceId,
        title: appointment.service.title,
        count: (current?.count ?? 0) + 1,
      });
    });

    const services = Array.from(servicesMap.values())
      .map((service) => ({
        ...service,
        percentage: completedAppointments.length > 0
          ? Math.round((service.count / completedAppointments.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

    return {
      barber,
      history: appointments,
      statsByDay,
      services,
      totalCompleted: completedAppointments.length,
      totalAppointments: appointments.length,
      period: { month: selectedMonth, year: selectedYear },
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
    const appointmentCount = await prisma.appointment.count({ where: { barberId: id } });
    if (appointmentCount > 0) {
      throw new Error("No se puede eliminar este barbero porque tiene turnos registrados. Podés desactivarlo para conservar el historial.");
    }
    return await prisma.barber.delete({
      where: { id },
    });
  },
};
