import { prisma } from "@/lib/prisma";
import { AppointmentSchema } from "@/lib/validations";
import { CustomerService } from "./customer.service";
import { Prisma } from "@prisma/client";
import { getShopDateString, getShopDayBounds, shopDateTime } from "@/lib/datetime";
import { AppError } from "@/lib/app-error";

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
            email: data.customerEmail || undefined,
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

      if (!service || !service.isActive) throw new AppError("El servicio seleccionado ya no está disponible.", 409, "SERVICE_UNAVAILABLE");
      const selectedBarber = await prisma.barber.findUnique({ where: { id: validated.barberId }, select: { isActive: true } });
      if (!selectedBarber?.isActive) throw new AppError("El barbero seleccionado ya no está disponible para nuevas reservas.", 409, "BARBER_UNAVAILABLE");

      const startTime = new Date(validated.startTime);
      if (Number.isNaN(startTime.getTime())) throw new AppError("La fecha seleccionada no es válida.", 400, "INVALID_DATE");
      if (startTime <= new Date()) throw new AppError("Ese horario ya pasó. Elegí una fecha y hora futuras.", 409, "PAST_SLOT");
      const duration = service.duration;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      return await prisma.$transaction(async (tx) => {
        // Serialize confirmations for the same barber and start time. A second
        // request waits, then recalculates availability with the latest data.
        const lockKey = `${validated.barberId}:${startTime.toISOString()}`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        const availableSlots = await this.getAvailableSlots(
          validated.barberId,
          getShopDateString(startTime),
          duration,
          validated.serviceId
        );
        const isAvailable = availableSlots.some((slot) => slot.startTime.getTime() === startTime.getTime());
        if (!isAvailable) {
          throw new AppError("Ese horario acaba de dejar de estar disponible. Elegí otro para continuar.", 409, "SLOT_UNAVAILABLE");
        }

        return tx.appointment.create({ data: { ...validated, endTime } });
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
    const [shopYear, shopMonth] = getShopDateString(now).split("-").map(Number);
    const monthStart = shopDateTime(`${shopYear}-${String(shopMonth).padStart(2, "0")}-01`, "00:00");
    const nextMonthYear = shopMonth === 12 ? shopYear + 1 : shopYear;
    const nextMonth = shopMonth === 12 ? 1 : shopMonth + 1;
    const nextMonthStart = shopDateTime(`${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`, "00:00");

    const [total, today, completedAppointments, completedThisMonth, activeBarbers, offeredServices] = await Promise.all([
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
      prisma.appointment.count({
        where: {
          status: "COMPLETED",
          startTime: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      prisma.barber.count({ where: { isActive: true } }),
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
        completedThisMonth,
        completionRate: total > 0 ? (completedAppointments.length / total) * 100 : 0,
        activeBarbers,
        offeredServices,
      },
      activity,
    };
  },

  /**
   * Generates available time slots from the shop, barber and calendar rules.
   */
  async getAvailableSlots(barberId: string, dateString: string, durationMinutes: number = 30, serviceId?: string) {
    const shopDate = shopDateTime(dateString, "12:00");
    const dayOfWeek = shopDate.getUTCDay();
    const settings = await prisma.shopSettings.findFirst({
      include: { businessHours: { where: { dayOfWeek } } },
    });
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        availability: { where: { dayOfWeek } },
        breaks: { where: { dayOfWeek } },
        services: true,
      },
    });
    if (!barber) return [];
    if (!barber.isActive) return [];

    if (serviceId && barber.servicesConfigured && !barber.services.some((item) => item.serviceId === serviceId)) return [];

    const shopHours = settings?.businessHours[0];
    const barberHours = barber.availability[0];
    const isWorking = barberHours ? barberHours.isWorking : (shopHours?.isOpen ?? dayOfWeek !== 0);
    if (!isWorking) return [];

    const startClock = barberHours?.startTime ?? shopHours?.startTime ?? "08:00";
    const endClock = barberHours?.endTime ?? shopHours?.endTime ?? "20:00";
    const dayStart = shopDateTime(dateString, startClock);
    const dayEnd = shopDateTime(dateString, endClock);
    const bufferMinutes = settings?.bufferMinutes ?? 0;

    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        startDate: { lte: dateString },
        endDate: { gte: dateString },
        OR: [{ barberId: null }, { barberId }],
      },
    });
    if (blocks.some((block) => block.allDay)) return [];

    const unavailableRanges = [
      ...barber.breaks.map((item) => ({ start: shopDateTime(dateString, item.startTime), end: shopDateTime(dateString, item.endTime) })),
      ...blocks
        .filter((block) => !block.allDay && block.startTime && block.endTime)
        .map((block) => ({ start: shopDateTime(dateString, block.startTime!), end: shopDateTime(dateString, block.endTime!) })),
    ];

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

      const isOverlap = appointments.some((app) =>
        currentSlot < new Date(app.endTime.getTime() + bufferMinutes * 60000) &&
        new Date(slotEndTime.getTime() + bufferMinutes * 60000) > app.startTime
      );
      const crossesBlockedRange = unavailableRanges.some((range) => currentSlot < range.end && slotEndTime > range.start);

      if (!isOverlap && !crossesBlockedRange && currentSlot >= new Date()) {
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
