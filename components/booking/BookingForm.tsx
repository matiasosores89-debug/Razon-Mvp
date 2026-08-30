"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BarberSelector } from "./BarberSelector";
import { ServiceSelector } from "./ServiceSelector";
import { SlotSelector } from "./SlotSelector";
import { CustomerForm } from "./CustomerForm";
import { AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { getShopDateString, SHOP_TIME_ZONE } from "@/lib/datetime";
import { Turnstile } from "@/components/security/Turnstile";

type Step = "barber" | "service" | "slot" | "customer" | "confirm" | "success";
type BookingNotice = { title: string; message: string; code: string; retry?: () => void };

class BookingRequestError extends Error {
  constructor(message: string, public code: string, public status: number, public details?: Record<string, string[]>) {
    super(message);
  }
}

export const BookingForm = () => {
  const router = useRouter();
  const submittingRef = React.useRef(false);
  const [step, setStep] = useState<Step>("barber");
  const [apiLoading, setApiLoading] = useState({
    barbers: true,
    services: true,
    slots: false,
    submit: false,
  });

  const [selection, setSelection] = useState({
    barberId: null as string | null,
    serviceId: null as string | null,
    date: getShopDateString(),
    slot: null as string | null,
    customer: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const [data, setData] = useState({
    barbers: [] as any[],
    services: [] as any[],
    slots: [] as any[],
  });

  const [errors, setErrors] = useState<Record<string, any>>({});
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const barberId = params.get("barberId");
    const serviceId = params.get("serviceId");
    if (barberId) {
      setSelection(prev => ({ ...prev, barberId }));
    }
    if (serviceId) {
      setSelection(prev => ({ ...prev, serviceId }));
    }
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (!selection.barberId) return;
    fetchServices(selection.barberId);
  }, [selection.barberId]);

  useEffect(() => {
    if (selection.barberId && selection.date) {
      fetchSlots();
    }
  }, [selection.barberId, selection.serviceId, selection.date]);

  async function fetchBarbers() {
    setErrors((current) => ({ ...current, booking: undefined }));
    try {
      const res = await fetch("/api/barbers");
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error("No pudimos cargar el equipo.");
      setData(prev => ({ ...prev, barbers: result.data }));
    } catch (e) {
      console.error("Error fetching barbers", e);
      setErrors((current) => ({ ...current, booking: { title: "No pudimos cargar los barberos", message: "Revisá tu conexión e intentá nuevamente.", code: "LOAD_BARBERS", retry: fetchBarbers } satisfies BookingNotice }));
    } finally {
      setApiLoading(prev => ({ ...prev, barbers: false }));
    }
  }

  async function fetchServices(barberId: string) {
    setErrors((current) => ({ ...current, booking: undefined }));
    setApiLoading(prev => ({ ...prev, services: true }));
    try {
      const res = await fetch(`/api/services?barberId=${encodeURIComponent(barberId)}`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error("No pudimos cargar los servicios.");
      if (result.success) {
        setData(prev => ({ ...prev, services: result.data }));
        setSelection(prev => result.data.some((service: { id: string }) => service.id === prev.serviceId)
          ? prev
          : { ...prev, serviceId: null, slot: null });
      }
    } catch (e) {
      console.error("Error fetching services", e);
      setErrors((current) => ({ ...current, booking: { title: "No pudimos cargar los servicios", message: "Intentá nuevamente antes de continuar.", code: "LOAD_SERVICES", retry: () => fetchServices(barberId) } satisfies BookingNotice }));
    } finally {
      setApiLoading(prev => ({ ...prev, services: false }));
    }
  }

  async function fetchSlots() {
    setErrors((current) => ({ ...current, booking: undefined }));
    setApiLoading(prev => ({ ...prev, slots: true }));
    try {
      const service = data.services.find(s => s.id === selection.serviceId);
      const duration = service ? service.duration : 30;

      const params = new URLSearchParams({
        barberId: selection.barberId!,
        date: selection.date,
        duration: String(duration),
      });
      if (selection.serviceId) params.set("serviceId", selection.serviceId);
      const res = await fetch(`/api/appointments/availability?${params.toString()}`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error("No pudimos consultar los horarios.");
      setData(prev => ({ ...prev, slots: result.data }));
    } catch (e) {
      console.error("Error fetching slots", e);
      setErrors((current) => ({ ...current, booking: { title: "No pudimos cargar los horarios", message: "Revisá tu conexión y volvé a intentarlo.", code: "LOAD_SLOTS", retry: fetchSlots } satisfies BookingNotice }));
    } finally {
      setApiLoading(prev => ({ ...prev, slots: false }));
    }
  }

  const handleCustomerChange = (field: string, value: string) => {
    setSelection(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value }
    }));
  };

  const clearBookingError = () => setErrors((current) => ({ ...current, booking: undefined }));

  async function handleSubmit() {
    // Final validation check
    const { name, phone } = selection.customer;
    if (!name || !phone) {
      setErrors({ form: "Faltan datos obligatorios del cliente" });
      setStep("customer");
      return;
    }
    if (!selection.barberId || !selection.serviceId || !selection.slot) {
      setErrors({ booking: { title: "Falta información de la reserva", message: "Volvé a seleccionar el barbero, el servicio y el horario.", code: "INCOMPLETE_BOOKING" } satisfies BookingNotice });
      return;
    }
    if (!turnstileToken) {
      setErrors({ booking: { title: "Falta la verificación de seguridad", message: "Completá el control anti-spam para confirmar el turno.", code: "CAPTCHA_REQUIRED" } satisfies BookingNotice });
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;

    setApiLoading(prev => ({ ...prev, submit: true }));
    setErrors({});

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: selection.barberId,
          serviceId: selection.serviceId,
          // The selected slot is already an absolute ISO instant from the API.
          startTime: selection.slot,
          customerName: selection.customer.name,
          customerPhone: selection.customer.phone,
          customerEmail: selection.customer.email,
          turnstileToken,
        }),
      });

      const result = await res.json().catch(() => null);
      if (res.ok && result?.success) {
        setStep("success");
      } else {
        throw new BookingRequestError(result?.error?.message || "No pudimos confirmar el turno.", result?.error?.code || "BOOKING_FAILED", res.status, result?.error?.details);
      }
    } catch (error) {
      const requestError = error instanceof BookingRequestError ? error : null;
      if (requestError?.code === "SLOT_UNAVAILABLE" || requestError?.code === "PAST_SLOT") {
        setSelection((current) => ({ ...current, slot: null }));
        setStep("slot");
        await fetchSlots();
        setErrors({ booking: {
          title: requestError.code === "PAST_SLOT" ? "Ese horario ya pasó" : "Ese horario acaba de ocuparse",
          message: requestError.code === "PAST_SLOT" ? "Elegí un nuevo horario para continuar con la reserva." : "Otra persona lo confirmó antes. Ya actualizamos los horarios disponibles para que elijas otro.",
          code: requestError.code,
        } satisfies BookingNotice });
      } else if (requestError?.code === "SERVICE_UNAVAILABLE") {
        setSelection((current) => ({ ...current, serviceId: null, slot: null }));
        setStep("service");
        if (selection.barberId) await fetchServices(selection.barberId);
        setErrors({ booking: { title: "El servicio ya no está disponible", message: "Elegí otro servicio para continuar.", code: requestError.code } satisfies BookingNotice });
      } else if (requestError?.code === "BARBER_UNAVAILABLE") {
        setSelection((current) => ({ ...current, barberId: null, serviceId: null, slot: null }));
        setStep("barber");
        await fetchBarbers();
        setErrors({ booking: { title: "El barbero ya no está disponible", message: "Elegí otro integrante del equipo para continuar.", code: requestError.code } satisfies BookingNotice });
      } else if (requestError?.code === "VALIDATION_ERROR" || requestError?.code === "CUSTOMER_ERROR") {
        const fieldErrors = requestError.details ?? {};
        setStep("customer");
        setErrors({
          name: fieldErrors.name?.[0],
          phone: fieldErrors.phone?.[0],
          email: fieldErrors.email?.[0],
          booking: { title: "Revisá tus datos", message: "Hay información incompleta o con un formato incorrecto.", code: requestError.code } satisfies BookingNotice,
        });
      } else if (error instanceof TypeError) {
        setErrors({ booking: { title: "No pudimos conectarnos", message: "Revisá tu conexión. Tus datos siguen guardados y podés volver a intentar.", code: "NETWORK_ERROR", retry: handleSubmit } satisfies BookingNotice });
      } else {
        if (requestError?.code === "CAPTCHA_INVALID" || requestError?.code === "CAPTCHA_REQUIRED") {
          setTurnstileToken("");
          setTurnstileReset((value) => value + 1);
        }
        setErrors({ booking: { title: "No pudimos confirmar el turno", message: requestError?.message || "Ocurrió un problema inesperado. Tus datos siguen guardados.", code: requestError?.code || "UNKNOWN_ERROR", retry: handleSubmit } satisfies BookingNotice });
      }
    } finally {
      submittingRef.current = false;
      setApiLoading(prev => ({ ...prev, submit: false }));
    }
  }

  const nextStep = () => {
    if (step === "barber") setStep("service");
    else if (step === "service") setStep("slot");
    else if (step === "slot") setStep("customer");
    else if (step === "customer") {
      const { name, phone, email } = selection.customer;
      const newErrors: any = {};

      if (!name || name.trim().length < 2) {
        newErrors.name = "Por favor, ingresa tu nombre completo";
      }
      if (!phone || phone.trim().length < 7) {
        newErrors.phone = "Por favor, ingresa un teléfono válido";
      }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        newErrors.email = "Ingresá un email válido o dejá el campo vacío";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      setStep("confirm");
    }
  };

  const prevStep = () => {
    if (step === "service") setStep("barber");
    else if (step === "slot") setStep("service");
    else if (step === "customer") setStep("slot");
    else if (step === "confirm") setStep("customer");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12">
      <div className="mb-7 text-center sm:mb-12">
        <h2 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl">Reserva tu Turno</h2>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
          {["Barbero", "Servicio", "Fecha", "Datos", "Confirmar"].map((label, i) => (
            <React.Fragment key={label}>
              <div className={`h-2 w-2 rounded-full ${
                (i === 0 && step === "barber") || (i === 1 && step === "service") ||
                (i === 2 && step === "slot") || (i === 3 && step === "customer") ||
                (i === 4 && step === "confirm")
                ? "bg-primary w-4" : "bg-white/20"
              }`} />
              {i < 4 && <div className="h-px w-3 bg-white/10 sm:w-8" />}
              <span className={`hidden sm:inline ${
                (i === 0 && step === "barber") || (i === 1 && step === "service") ||
                (i === 2 && step === "slot") || (i === 3 && step === "customer") ||
                (i === 4 && step === "confirm")
                ? "text-primary font-medium" : ""
              }`}>{label}</span>
              {i < 4 && <div className="hidden h-px w-8 bg-white/10 sm:block" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-8">
        {errors.booking && <BookingErrorNotice notice={errors.booking as BookingNotice} />}
        <AnimatePresence mode="wait">
          {step === "barber" && (
            <motion.div
              key="barber"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Elige tu Barbero</h3>
                <p className="text-muted-foreground">Selecciona el profesional que prefieras</p>
              </div>
              <BarberSelector
                barbers={data.barbers}
                selectedBarberId={selection.barberId}
                onSelect={(id) => { clearBookingError(); setSelection(prev => ({ ...prev, barberId: id })); }}
                isLoading={apiLoading.barbers}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  disabled={!selection.barberId}
                  onClick={nextStep}
                  className="w-full px-8 sm:w-auto"
                >
                  Siguiente <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "service" && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Selecciona el Servicio</h3>
                <p className="text-muted-foreground">Elige lo que necesitas hoy</p>
              </div>
              <ServiceSelector
                services={data.services}
                selectedServiceId={selection.serviceId}
                onSelect={(id) => { clearBookingError(); setSelection(prev => ({ ...prev, serviceId: id })); }}
                isLoading={apiLoading.services}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
                <Button
                  variant="primary"
                  disabled={!selection.serviceId}
                  onClick={nextStep}
                  className="w-full px-8 sm:w-auto"
                >
                  Siguiente <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "slot" && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Fecha y Hora</h3>
                <p className="text-muted-foreground">Busca el mejor momento para ti</p>
              </div>
              <SlotSelector
                selectedDate={selection.date}
                setSelectedDate={(date) => { clearBookingError(); setSelection(prev => ({ ...prev, date, slot: null })); }}
                slots={data.slots}
                selectedSlot={selection.slot}
                onSelectSlot={(slot) => { clearBookingError(); setSelection(prev => ({ ...prev, slot })); }}
                isLoading={apiLoading.slots}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
                <Button
                  variant="primary"
                  disabled={!selection.slot}
                  onClick={nextStep}
                  className="w-full px-8 sm:w-auto"
                >
                  Siguiente <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "customer" && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Tus Datos</h3>
                <p className="text-muted-foreground">Solo necesitamos unos detalles para confirmar</p>
              </div>
              <CustomerForm
                formData={selection.customer}
                onChange={handleCustomerChange}
                errors={errors}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  className="w-full px-8 sm:w-auto"
                >
                  Revisar Turno <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Confirmar Reserva</h3>
                <p className="text-muted-foreground">Verifica que todo esté correcto</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:space-y-4 sm:p-6">
                <div className="flex flex-col gap-1 border-b border-white/5 py-2 sm:flex-row sm:justify-between sm:gap-4">
                  <span className="text-muted-foreground">Barbero</span>
                  <span className="text-white font-medium">
                    {data.barbers.find(b => b.id === selection.barberId)?.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/5 py-2 sm:flex-row sm:justify-between sm:gap-4">
                  <span className="text-muted-foreground">Servicio</span>
                  <span className="text-white font-medium">
                    {data.services.find(s => s.id === selection.serviceId)?.title}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/5 py-2 sm:flex-row sm:justify-between sm:gap-4">
                  <span className="text-muted-foreground">Fecha y Hora</span>
                  <span className="text-white font-medium">
                    {selection.slot && new Date(selection.slot).toLocaleString('es-AR', {
                      timeZone: SHOP_TIME_ZONE,
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex flex-col gap-1 py-2 sm:flex-row sm:justify-between sm:gap-4">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-white font-medium">{selection.customer.name}</span>
                </div>
              </div>

              <div className={`rounded-xl border px-4 py-3 transition-colors ${turnstileToken ? "border-emerald-400/20 bg-emerald-400/[0.05]" : "border-white/10 bg-black/15"}`}>
                <Turnstile action="book_appointment" onVerify={setTurnstileToken} resetKey={turnstileReset} />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Editar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={apiLoading.submit || !turnstileToken}
                  className="relative w-full px-8 sm:w-auto"
                  aria-describedby={!turnstileToken ? "booking-security-help" : undefined}
                >
                  {apiLoading.submit ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Confirmar Turno Ahora"
                  )}
                </Button>
              </div>
              {!turnstileToken && <p id="booking-security-help" className="text-right text-xs text-zinc-500">El botón se habilita cuando finaliza la verificación.</p>}
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-6"
            >
              <div className="flex justify-center">
                <div className="bg-primary/20 text-primary p-4 rounded-full">
                  <CheckCircle size={64} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white">¡Turno Reservado!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Tu cita ha sido programada con éxito. Te esperamos para elevar tu estilo.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push("/")}
                className="px-12"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function BookingErrorNotice({ notice }: { notice: BookingNotice }) {
  const isNetwork = notice.code === "NETWORK_ERROR" || notice.code.startsWith("LOAD_");
  return (
    <div role="alert" aria-live="assertive" className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">{isNetwork ? <WifiOff size={18} /> : <AlertTriangle size={18} />}</span>
        <div className="min-w-0"><p className="text-sm font-semibold text-white">{notice.title}</p><p className="mt-1 text-sm leading-5 text-zinc-400">{notice.message}</p></div>
      </div>
      {notice.retry && <button type="button" onClick={notice.retry} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-500/20 px-3 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/10"><RefreshCw size={14} /> Reintentar</button>}
    </div>
  );
}
