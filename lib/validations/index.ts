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
});

export const ServiceSchema = z.object({
  title: z.string().min(2, "El título del servicio debe tener al menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  duration: z.number().int().positive("La duración debe ser un número entero positivo (minutos)"),
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
