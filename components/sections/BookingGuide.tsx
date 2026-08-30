"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, User, CheckCircle, Clock } from "lucide-react";

const steps = [
  {
    title: "Elegí el servicio",
    description: "Revisá el precio y la duración antes de continuar.",
    icon: User,
  },
  {
    title: "Elegí tu barbero",
    description: "Reservá con tu barbero habitual o conocé la especialidad de cada uno.",
    icon: Calendar,
  },
  {
    title: "Buscá un horario",
    description: "Vas a ver únicamente los turnos que están disponibles.",
    icon: Clock,
  },
  {
    title: "Confirmá la reserva",
    description: "Dejanos tus datos y el turno queda agendado.",
    icon: CheckCircle,
  },
];

export const BookingGuide = () => {
  return (
    <section id="booking-guide" className="py-24 bg-luxury-dark relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold tracking-widest uppercase text-sm">Reserva online</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
              Tu turno, en cuatro pasos
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 bg-luxury-black border border-border rounded-2xl text-center group hover:border-primary/30 transition-all duration-300"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-luxury-black rounded-full flex items-center justify-center font-bold text-xl z-10 shadow-lg shadow-primary/20">
                  {index + 1}
                </div>
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform duration-300">
                    <Icon size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
