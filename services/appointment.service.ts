import { prisma } from "@/lib/prisma";
import { AppointmentSchema } from "@/lib/validations";
import { CustomerService } from "./customer.service";
import { Prisma } from "@prisma/client";
import { getShopDateString, getShopDayBounds, shopDateTime } from "@/lib/datetime";

export const AppointmentService = {
  /**
   * Checks if a barber is available for a given time window.
   * Returns true if available, false if there is an overlap.
   */
  async checkAvailability(barberId: string, startTime: Date, durationMinutes: number) {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const overlap = await prisma.appointment.findFirst({
      where: {
        barberId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    return !overlap;
  },

  /**
   * Creates a new appointment if the barber is available.
   */
  async create(data: any) {
    try {
      let customerId = data.customerId;

      // Si no hay customerId pero tenemos nombre y teléfono, creamos el cliente primero
      if (!customerId || customerId === "" ) {
        if (data.customerName && data.customerPhone) {
          const customer = await CustomerService.create({
            name: data.customerName,
            phone: data.customerPhone,
          });
          customerId = customer.id;
        } else {
          throw new Error("Se requiere un cliente (seleccione uno o complete nombre y teléfono)");
        }
      }

      let validated;
      try {
        validated = AppointmentSchema.parse({ ...data, customerId });
      } catch (error: any) {
        console.error("Validation error in AppointmentService.create:", error.errors);
        throw new Error(`Error de validación: ${error.errors?.[0]?.message || "Datos inválidos"}`);
      }

      const service = await prisma.service.findUnique({
        where: { id: validated.serviceId },
      });


      if (!service) {
        throw new Error("El servicio seleccionado no existe");
      }

      const startTime = new Date(validated.startTime);
      const duration = service.duration;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const isAvailable = await this.checkAvailability(validated.barberId, startTime, duration);

      if (!isAvailable) {
        throw new Error("El barbero ya tiene un turno programado en este horario");
      }

      return await prisma.appointment.create({
        data: {
          ...validated,
          endTime,
        },
      });
    } catch (error: any) {
      console.error("Error in AppointmentService.create:", error);
      throw error;
    }
  },

  /**
   * Lists appointments with optional filters.
   */
  async getAll(filters: { barberId?: string; date?: string }) {
    const { barberId, date } = filters;

    return await prisma.appointment.findMany({
      where: {
        ...(barberId && { barberId }),
        ...(date && (() => {
          const { start, end } = getShopDayBounds(date);
          return { startTime: { gte: start, lte: end } };
        })()),
      },
      include: {
        barber: true,
        customer: true,
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });
  },

  /**
   * Retrieves a specific appointment.
   */
  async getById(id: string) {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: true,
        customer: true,
        service: true,
      },
    });
  },

  /**
   * Updates the status of an appointment.
   */
  async updateStatus(id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW") {
    return await prisma.appointment.update({
      where: { id },
      data: { status },
    });
  },

  async update(id: string, data: any) {
    // Filter the data to only include fields valid for Appointment
    let validated;
    try {
      validated = AppointmentSchema.partial().parse(data);
    } catch (error: any) {
      console.error("Validation error in AppointmentService.update:", error.errors);
      throw new Error(`Error de validación: ${error.errors?.[0]?.message || "Datos inválidos"}`);
    }

    const updateData: Prisma.AppointmentUncheckedUpdateInput = { ...validated };

    if (validated.startTime) {
      const startTime = new Date(validated.startTime);
      updateData.startTime = startTime;
      const service = await prisma.service.findUnique({
        where: { id: validated.serviceId || (await prisma.appointment.findUnique({ where: { id } }))?.serviceId },
      });
      if (service) {
        updateData.endTime = new Date(startTime.getTime() + service.duration * 60000);
      }
    }

    return await prisma.appointment.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return await prisma.appointment.delete({
      where: { id },
    });
  },

  /**
   * Generates administrative statistics.
   */
  async getAdminStats() {
    const now = new Date();
    const { start: startOfToday, end: endOfToday } = getShopDayBounds(getShopDateString(now));

    const [total, today, completedAppointments, activeBarbers, offeredServices] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          startTime: { gte: startOfToday, lte: endOfToday },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.appointment.findMany({
        where: { status: "COMPLETED" },
        include: { service: true },
      }),
      prisma.barber.count(),
      prisma.service.count(),
    ]);

    const totalRevenue = completedAppointments.reduce(
      (sum, app) => sum + Number(app.service.price),
      0
    );

    // Activity for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const { start: activityStart } = getShopDayBounds(getShopDateString(thirtyDaysAgo));

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: activityStart },
        status: { not: "CANCELLED" },
      },
      select: { startTime: true },
    });

    const activityMap: Record<string, number> = {};
    appointments.forEach(app => {
      const date = getShopDateString(app.startTime);
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    const activity = Object.entries(activityMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalAppointments: total,
        todayAppointments: today,
        totalRevenue,
        completionRate: total > 0 ? (completedAppointments.length / total) * 100 : 0,
        activeBarbers,
        offeredServices,
      },
      activity,
    };
  },

  /**
   * Generates available time slots for a barber on a specific date.
   * Assumes shop hours 08:00 - 20:00.
   */
  async getAvailableSlots(barberId: string, dateString: string, durationMinutes: number = 30) {
    const dayStart = shopDateTime(dateString, "08:00");
    const dayEnd = shopDateTime(dateString, "20:00");

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        startTime: { gte: dayStart, lt: dayEnd },
        status: { not: "CANCELLED" },
      },
      orderBy: { startTime: 'asc' },
    });

    const slots = [];
    let currentSlot = new Date(dayStart);
    const slotInterval = 30; // Slots are offered every 30 minutes

    while (currentSlot < dayEnd) {
      const nextSlot = new Date(currentSlot.getTime() + slotInterval * 60000);
      const slotEndTime = new Date(currentSlot.getTime() + durationMinutes * 60000);

      if (slotEndTime > dayEnd) break;

      const isOverlap = appointments.some(
        app => app.startTime < slotEndTime && app.endTime > currentSlot
      );

      if (!isOverlap) {
        slots.push({
          startTime: new Date(currentSlot),
          endTime: slotEndTime,
        });
      }
      currentSlot = nextSlot;
    }

    return slots;
  },
};
