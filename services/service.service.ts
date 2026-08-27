import { prisma } from "@/lib/prisma";
import { ServiceSchema } from "@/lib/validations";

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
  async getAll() {
    return await prisma.service.findMany({
      orderBy: { title: 'asc' },
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
