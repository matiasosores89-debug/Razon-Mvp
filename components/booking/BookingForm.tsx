"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BarberSelector } from "./BarberSelector";
import { ServiceSelector } from "./ServiceSelector";
import { SlotSelector } from "./SlotSelector";
import { CustomerForm } from "./CustomerForm";
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getShopDateString, SHOP_TIME_ZONE } from "@/lib/datetime";

type Step = "barber" | "service" | "slot" | "customer" | "confirm" | "success";

export const BookingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("barber");
  const [isLoading, setIsLoading] = useState(false);
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

  const [errors, setErrors] = useState<any>({});

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
    fetchServices();
  }, []);

  useEffect(() => {
    if (selection.barberId && selection.date) {
      fetchSlots();
    }
  }, [selection.barberId, selection.serviceId, selection.date]);

  async function fetchBarbers() {
    try {
      const res = await fetch("/api/barbers");
      const result = await res.json();
      if (result.success) setData(prev => ({ ...prev, barbers: result.data }));
    } catch (e) {
      console.error("Error fetching barbers", e);
    } finally {
      setApiLoading(prev => ({ ...prev, barbers: false }));
    }
  }

  async function fetchServices() {
    try {
      const res = await fetch("/api/services");
      const result = await res.json();
      if (result.success) setData(prev => ({ ...prev, services: result.data }));
    } catch (e) {
      console.error("Error fetching services", e);
    } finally {
      setApiLoading(prev => ({ ...prev, services: false }));
    }
  }

  async function fetchSlots() {
    setApiLoading(prev => ({ ...prev, slots: true }));
    try {
      const service = data.services.find(s => s.id === selection.serviceId);
      const duration = service ? service.duration : 30;

      const res = await fetch(`/api/appointments/availability?barberId=${selection.barberId}&date=${selection.date}&duration=${duration}`);
      const result = await res.json();
      if (result.success) setData(prev => ({ ...prev, slots: result.data }));
    } catch (e) {
      console.error("Error fetching slots", e);
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

  async function handleSubmit() {
    // Final validation check
    const { name, phone } = selection.customer;
    if (!name || !phone) {
      setErrors({ form: "Faltan datos obligatorios del cliente" });
      setStep("customer");
      return;
    }

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
          customerId: await createCustomer(),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setStep("success");
      } else {
        throw new Error(result.message || "Error creating appointment");
      }
    } catch (e: any) {
      setErrors({ form: e.message });
    } finally {
      setApiLoading(prev => ({ ...prev, submit: false }));
    }
  }

  async function createCustomer() {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selection.customer),
    });
    const result = await res.json();
    if (!result.success) throw new Error("Error creating customer");
    return result.data.id;
  }

  const nextStep = () => {
    if (step === "barber") setStep("service");
    else if (step === "service") setStep("slot");
    else if (step === "slot") setStep("customer");
    else if (step === "customer") {
      const { name, phone } = selection.customer;
      const newErrors: any = {};

      if (!name || name.trim().length < 2) {
        newErrors.name = "Por favor, ingresa tu nombre completo";
      }
      if (!phone || phone.trim().length < 7) {
        newErrors.phone = "Por favor, ingresa un teléfono válido";
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Reserva tu Turno</h2>
        <div className="flex justify-center items-center gap-2 text-muted-foreground text-sm">
          {["Barbero", "Servicio", "Fecha", "Datos", "Confirmar"].map((label, i) => (
            <React.Fragment key={label}>
              <div className={`h-2 w-2 rounded-full ${
                (i === 0 && step === "barber") || (i === 1 && step === "service") ||
                (i === 2 && step === "slot") || (i === 3 && step === "customer") ||
                (i === 4 && step === "confirm")
                ? "bg-primary w-4" : "bg-white/20"
              }`} />
              {i < 4 && <div className="h-px w-8 bg-white/10" />}
              <span className={
                (i === 0 && step === "barber") || (i === 1 && step === "service") ||
                (i === 2 && step === "slot") || (i === 3 && step === "customer") ||
                (i === 4 && step === "confirm")
                ? "text-primary font-medium" : ""
              }>{label}</span>
              {i < 4 && <div className="h-px w-8 bg-white/10" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "barber" && (
            <motion.div
              key="barber"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Elige tu Barbero</h3>
                <p className="text-muted-foreground">Selecciona el profesional que prefieras</p>
              </div>
              <BarberSelector
                barbers={data.barbers}
                selectedBarberId={selection.barberId}
                onSelect={(id) => setSelection(prev => ({ ...prev, barberId: id }))}
                isLoading={apiLoading.barbers}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  disabled={!selection.barberId}
                  onClick={nextStep}
                  className="px-8"
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
              className="space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Selecciona el Servicio</h3>
                <p className="text-muted-foreground">Elige lo que necesitas hoy</p>
              </div>
              <ServiceSelector
                services={data.services}
                selectedServiceId={selection.serviceId}
                onSelect={(id) => setSelection(prev => ({ ...prev, serviceId: id }))}
                isLoading={apiLoading.services}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
                <Button
                  variant="primary"
                  disabled={!selection.serviceId}
                  onClick={nextStep}
                  className="px-8"
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
              className="space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Fecha y Hora</h3>
                <p className="text-muted-foreground">Busca el mejor momento para ti</p>
              </div>
              <SlotSelector
                selectedDate={selection.date}
                setSelectedDate={(date) => setSelection(prev => ({ ...prev, date, slot: null }))}
                slots={data.slots}
                selectedSlot={selection.slot}
                onSelectSlot={(slot) => setSelection(prev => ({ ...prev, slot }))}
                isLoading={apiLoading.slots}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
                <Button
                  variant="primary"
                  disabled={!selection.slot}
                  onClick={nextStep}
                  className="px-8"
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
              className="space-y-8"
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
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  className="px-8"
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
              className="space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Confirmar Reserva</h3>
                <p className="text-muted-foreground">Verifica que todo esté correcto</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Barbero</span>
                  <span className="text-white font-medium">
                    {data.barbers.find(b => b.id === selection.barberId)?.name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Servicio</span>
                  <span className="text-white font-medium">
                    {data.services.find(s => s.id === selection.serviceId)?.title}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Fecha y Hora</span>
                  <span className="text-white font-medium">
                    {selection.slot && new Date(selection.slot).toLocaleString('es-AR', {
                      timeZone: SHOP_TIME_ZONE,
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-white font-medium">{selection.customer.name}</span>
                </div>
              </div>

              {errors.form && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm text-center">
                  {errors.form}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} className="text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft size={18} className="mr-2" /> Editar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={apiLoading.submit}
                  className="px-8 relative"
                >
                  {apiLoading.submit ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Confirmar Turno Ahora"
                  )}
                </Button>
              </div>
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
