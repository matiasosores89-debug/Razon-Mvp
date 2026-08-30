"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock3, Scissors } from "lucide-react";
import { Service } from "@/types";
import Link from "next/link";

export const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch("/api/services");
        const result = await response.json();
        if (result.success) setServices(result.data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <section id="services" className="relative overflow-hidden bg-luxury-black py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.55fr)] lg:gap-16 xl:gap-24">
          <motion.header
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 text-primary">
              <Scissors size={19} />
            </div>
            <h2 className="max-w-md text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl">
              Elegí lo que necesitás hoy.
            </h2>
            <p className="mt-6 max-w-sm text-pretty text-base leading-7 text-zinc-400">
              Cada servicio muestra su precio y duración antes de reservar. Sin sorpresas cuando llegás.
            </p>
            <Link href="/booking" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              Consultar horarios <ArrowUpRight size={16} />
            </Link>
          </motion.header>

          <div className="border-t border-white/10">
            {isLoading ? (
              <div className="divide-y divide-white/[0.07]" aria-label="Cargando servicios">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse py-7 sm:py-8">
                    <div className="flex items-center gap-5"><div className="h-5 w-6 rounded bg-white/[0.06]" /><div className="h-6 w-1/3 rounded bg-white/[0.07]" /><div className="ml-auto h-6 w-20 rounded bg-white/[0.07]" /></div>
                    <div className="ml-11 mt-3 h-4 w-2/3 rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center border-b border-white/10 text-center">
                <Scissors size={26} className="mb-4 text-zinc-600" />
                <h3 className="font-medium text-white">Estamos actualizando los servicios</h3>
                <p className="mt-2 text-sm text-zinc-500">Volvé a consultar en unos minutos.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {services.map((service, index) => (
                  <motion.article key={service.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.24), ease: [0.22, 1, 0.36, 1] }} className="group">
                    <Link href={`/booking?serviceId=${service.id}`} aria-label={`Reservar ${service.title}`} className="grid gap-4 py-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5 sm:py-8">
                      <span className="pt-1 text-xs font-medium tabular-nums text-zinc-600 transition-colors group-hover:text-primary">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                          <h3 className="text-balance text-xl font-semibold tracking-[-0.02em] text-white transition-colors group-hover:text-primary sm:text-2xl">{service.title}</h3>
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400"><Clock3 size={12} /> {service.duration} min</span>
                        </div>
                        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-zinc-500 sm:text-base">{service.description || "Consultá con nuestro equipo para conocer qué incluye este servicio."}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className="text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">${Number(service.price).toLocaleString("es-AR")}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-black"><ArrowUpRight size={16} /></span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
