import { prisma } from "@/lib/prisma";
import { CustomerSchema } from "@/lib/validations";
import { normalizePhone } from "@/lib/phone";

export const CustomerService = {
  /**
   * Creates a new customer.
   */
  async create(data: unknown) {
    const validated = CustomerSchema.parse(data);
    return await prisma.$transaction(async (tx) => {
      // Prevent simultaneous bookings for the same phone from creating duplicates.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${validated.phone}))`;

      // Normalize while comparing so records saved before this fix are reused too.
      const customers = await tx.customer.findMany({
        orderBy: { createdAt: "asc" },
      });
      const existing = customers.find(
        (customer) => normalizePhone(customer.phone) === validated.phone
      );

      if (existing) {
        return existing;
      }

      return tx.customer.create({
        data: validated,
      });
    });
  },

  /**
   * Lists all customers.
   */
  async getAll() {
    return await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Lists all customers with their completed appointments count.
   */
  async getAllWithStats() {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            appointments: {
              where: { status: "COMPLETED" },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      completedAppointments: c._count.appointments,
    }));
  },

  /**
   * Retrieves a customer by ID.
   */
  async getById(id: string) {
    return await prisma.customer.findUnique({
      where: { id },
    });
  },

  /**
   * Updates a customer.
   */
  async update(id: string, data: unknown) {
    const validated = CustomerSchema.partial().parse(data);
    return await prisma.customer.update({
      where: { id },
      data: validated,
    });
  },

  /**
   * Deletes a customer.
   */
  async delete(id: string) {
    return await prisma.customer.delete({
      where: { id },
    });
  },
};
