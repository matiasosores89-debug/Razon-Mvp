"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scissors, Brush, Wind, Sparkles } from "lucide-react";
import { Service } from "@/types";
import Link from "next/link";

export const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        const result = await res.json();
        if (result.success) {
          setServices(result.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <section id="services" className="py-24 bg-luxury-black relative">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-24 bg-luxury-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold tracking-widest uppercase text-sm">Menú de Servicios</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
              Experiencias a Medida
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Desde los clásicos atemporales hasta las tendencias más modernas.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            // Fallback icon mapping since the database doesn't store Lucide components
            const iconMap: any = {
              "Corte de pelo": Scissors,
              "Corte de pelo + barba": Brush,
              "Barba": Wind,
              "Tratamiento": Sparkles,
            };
            const Icon = iconMap[service.title] || Scissors;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-luxury-grey border border-border rounded-2xl group hover:border-primary/40 transition-all duration-300"
              >
                <Link
                  href={`/booking?serviceId=${service.id}`}
                  className="flex gap-6 p-8 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Reservar ${service.title}`}
                >
                  <div className="flex-shrink-0 p-4 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Icon size={32} />
                  </div>
                  <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{service.title}</h3>
                    <span className="text-primary font-bold">${service.price}</span>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span className="text-primary">⏱</span> {service.duration} min
                  </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
