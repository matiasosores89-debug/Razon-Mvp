import { prisma } from "@/lib/prisma";
import { AvailabilityConfigSchema } from "@/lib/validations";
import { ShopSettingsService } from "./shop-settings.service";

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isOpen: dayOfWeek !== 0,
  startTime: "08:00",
  endTime: "20:00",
}));

export const AvailabilityService = {
  async getConfig() {
    const settings = await ShopSettingsService.ensureSettings();
    let businessHours = await prisma.businessHour.findMany({
      where: { shopSettingsId: settings.id },
      orderBy: { dayOfWeek: "asc" },
    });

    if (businessHours.length === 0) {
      await prisma.businessHour.createMany({
        data: DEFAULT_HOURS.map((item) => ({ ...item, shopSettingsId: settings.id })),
      });
      businessHours = await prisma.businessHour.findMany({
        where: { shopSettingsId: settings.id },
        orderBy: { dayOfWeek: "asc" },
      });
    }

    const [barbers, services, blocks] = await Promise.all([
      prisma.barber.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          availability: { orderBy: { dayOfWeek: "asc" } },
          breaks: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
          services: { select: { serviceId: true } },
        },
      }),
      prisma.service.findMany({ where: { isActive: true }, orderBy: { title: "asc" } }),
      prisma.scheduleBlock.findMany({ orderBy: [{ startDate: "asc" }, { label: "asc" }] }),
    ]);

    return {
      bufferMinutes: settings.bufferMinutes,
      businessHours: businessHours.map(({ dayOfWeek, isOpen, startTime, endTime }) => ({ dayOfWeek, isOpen, startTime, endTime })),
      services,
      barbers: barbers.map((barber) => ({
        id: barber.id,
        name: barber.name,
        specialty: barber.specialty,
        availability: barber.availability.map(({ dayOfWeek, isWorking, startTime, endTime }) => ({ dayOfWeek, isWorking, startTime, endTime })),
        breaks: barber.breaks.map(({ id, dayOfWeek, startTime, endTime, label }) => ({ id, dayOfWeek, startTime, endTime, label })),
        serviceIds: barber.servicesConfigured ? barber.services.map((item) => item.serviceId) : services.map((service) => service.id),
      })),
      blocks,
    };
  },

  async saveConfig(data: unknown) {
    const config = AvailabilityConfigSchema.parse(data);
    const settings = await ShopSettingsService.ensureSettings();

    await prisma.$transaction(async (tx) => {
      await tx.shopSettings.update({ where: { id: settings.id }, data: { bufferMinutes: config.bufferMinutes } });
      await tx.businessHour.deleteMany({ where: { shopSettingsId: settings.id } });
      await tx.businessHour.createMany({ data: config.businessHours.map((item) => ({ ...item, shopSettingsId: settings.id })) });

      await tx.barberAvailability.deleteMany();
      await tx.barberBreak.deleteMany();
      await tx.barberService.deleteMany();
      await tx.scheduleBlock.deleteMany();

      for (const barber of config.barbers) {
        await tx.barber.update({ where: { id: barber.barberId }, data: { servicesConfigured: true } });
        if (barber.availability.length > 0) {
          await tx.barberAvailability.createMany({ data: barber.availability.map((item) => ({ ...item, barberId: barber.barberId })) });
        }
        if (barber.breaks.length > 0) {
          await tx.barberBreak.createMany({ data: barber.breaks.map((item) => ({ ...item, barberId: barber.barberId })) });
        }
        if (barber.serviceIds.length > 0) {
          await tx.barberService.createMany({ data: barber.serviceIds.map((serviceId) => ({ barberId: barber.barberId, serviceId })) });
        }
      }

      if (config.blocks.length > 0) {
        await tx.scheduleBlock.createMany({
          data: config.blocks.map(({ id: _id, ...block }) => block),
        });
      }
    });

    return this.getConfig();
  },
};
