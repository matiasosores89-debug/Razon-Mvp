import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const ShopSettingsSchema = z.object({
  name: z.string().min(2, "El nombre de la barbería debe tener al menos 2 caracteres").max(100),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Email inválido").max(100).optional(),
});

export const BarberSchema = z.object({
  name: z.string().min(2, "El nombre del barbero debe tener al menos 2 caracteres").max(100),
  specialty: z.string().min(2, "La especialidad es obligatoria").max(100),
  experience: z.number().int().min(0, "La experiencia no puede ser negativa"),
  image: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const ServiceSchema = z.object({
  title: z.string().min(2, "El título del servicio debe tener al menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  duration: z.number().int().positive("La duración debe ser un número entero positivo (minutos)"),
  isActive: z.boolean().optional(),
});

export const AdminServiceSchema = ServiceSchema.extend({
  barberIds: z.array(z.string().min(1)).default([]),
});

export const CustomerSchema = z.object({
  name: z.string().min(2, "El nombre del cliente debe tener al menos 2 caracteres").max(100),
  phone: z.string()
    .max(30)
    .transform(normalizePhone)
    .pipe(z.string().min(8, "Ingresá un teléfono válido").max(15, "Ingresá un teléfono válido")),
  email: z.string().email("Email inválido").max(100).optional(),
});

export const AppointmentSchema = z.object({
  barberId: z.string().min(1, "ID de barbero inválido"),
  customerId: z.string().min(1, "ID de cliente inválido"),
  serviceId: z.string().min(1, "ID de servicio inválido"),
  startTime: z.string().min(1, "La fecha de inicio es obligatoria"),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional().default("SCHEDULED"),
});

const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario inválido");
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const AvailabilityConfigSchema = z.object({
  bufferMinutes: z.number().int().min(0).max(120),
  businessHours: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    startTime: TimeSchema,
    endTime: TimeSchema,
  })).length(7),
  barbers: z.array(z.object({
    barberId: z.string().min(1),
    availability: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      isWorking: z.boolean(),
      startTime: TimeSchema,
      endTime: TimeSchema,
    })),
    breaks: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: TimeSchema,
      endTime: TimeSchema,
      label: z.string().max(80).optional(),
    })),
    serviceIds: z.array(z.string().min(1)),
  })),
  blocks: z.array(z.object({
    id: z.string().optional(),
    barberId: z.string().nullable(),
    type: z.enum(["HOLIDAY", "VACATION", "ABSENCE", "OTHER"]),
    label: z.string().min(2).max(100),
    startDate: DateSchema,
    endDate: DateSchema,
    allDay: z.boolean(),
    startTime: TimeSchema.nullable(),
    endTime: TimeSchema.nullable(),
  })),
}).superRefine((data, ctx) => {
  const validateRange = (start: string, end: string, path: (string | number)[]) => {
    if (start >= end) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La hora de cierre debe ser posterior a la de apertura", path });
  };
  data.businessHours.forEach((day, index) => { if (day.isOpen) validateRange(day.startTime, day.endTime, ["businessHours", index, "endTime"]); });
  data.barbers.forEach((barber, barberIndex) => {
    barber.availability.forEach((day, index) => { if (day.isWorking) validateRange(day.startTime, day.endTime, ["barbers", barberIndex, "availability", index, "endTime"]); });
    barber.breaks.forEach((item, index) => validateRange(item.startTime, item.endTime, ["barbers", barberIndex, "breaks", index, "endTime"]));
  });
  data.blocks.forEach((block, index) => {
    if (block.startDate > block.endDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El rango de fechas es inválido", path: ["blocks", index, "endDate"] });
    if (!block.allDay && (!block.startTime || !block.endTime || block.startTime >= block.endTime)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La franja horaria es inválida", path: ["blocks", index, "endTime"] });
    }
  });
});
