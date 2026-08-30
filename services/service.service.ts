import { prisma } from "@/lib/prisma";
import { AdminServiceSchema, ServiceSchema } from "@/lib/validations";

export const ServiceService = {
  /**
   * Creates a new service for a barbershop.
   */
  async create(data: unknown) {
    const validated = ServiceSchema.parse(data);
    return await prisma.service.create({
      data: validated,
    });
  },

  /**
   * Lists all services.
   */
  async getAll(barberId?: string) {
    if (barberId) {
      const barber = await prisma.barber.findUnique({ where: { id: barberId }, select: { servicesConfigured: true } });
      if (barber?.servicesConfigured) {
        return prisma.service.findMany({
          where: { isActive: true, barbers: { some: { barberId } } },
          orderBy: { title: "asc" },
        });
      }
    }
    return await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  },

  async getAdminCatalog() {
    const [services, barbers] = await Promise.all([
      prisma.service.findMany({
        orderBy: [{ isActive: "desc" }, { title: "asc" }],
        include: {
          barbers: { include: { barber: { select: { id: true, name: true } } } },
          _count: { select: { appointments: true } },
        },
      }),
      prisma.barber.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    return { services, barbers };
  },

  async createAdmin(data: unknown) {
    const { barberIds, ...serviceData } = AdminServiceSchema.parse(data);
    return prisma.$transaction(async (tx) => {
      const service = await tx.service.create({ data: serviceData });
      if (barberIds.length > 0) {
        await tx.barberService.createMany({ data: barberIds.map((barberId) => ({ barberId, serviceId: service.id })) });
        await tx.barber.updateMany({ where: { id: { in: barberIds } }, data: { servicesConfigured: true } });
      }
      return service;
    });
  },

  async updateAdmin(id: string, data: unknown) {
    const { barberIds, ...serviceData } = AdminServiceSchema.partial().parse(data);
    return prisma.$transaction(async (tx) => {
      const service = await tx.service.update({ where: { id }, data: serviceData });
      if (barberIds) {
        await tx.barberService.deleteMany({ where: { serviceId: id } });
        if (barberIds.length > 0) await tx.barberService.createMany({ data: barberIds.map((barberId) => ({ barberId, serviceId: id })) });
        await tx.barber.updateMany({ where: { id: { in: barberIds } }, data: { servicesConfigured: true } });
      }
      return service;
    });
  },

  /**
   * Retrieves a service by ID.
   */
  async getById(id: string) {
    return await prisma.service.findUnique({
      where: { id },
    });
  },

  /**
   * Updates a service.
   */
  async update(id: string, data: unknown) {
    const validated = ServiceSchema.partial().parse(data);
    return await prisma.service.update({
      where: { id },
      data: validated,
    });
  },

  /**
   * Deletes a service.
   */
  async delete(id: string) {
    return await prisma.service.delete({
      where: { id },
    });
  },
};
