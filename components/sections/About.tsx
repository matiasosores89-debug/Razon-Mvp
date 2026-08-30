"use client";

import React from "react";
import { motion } from "framer-motion";

export const About = () => {
  return (
    <section id="about" className="relative overflow-hidden bg-luxury-black py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden border border-border aspect-[4/5]">
              <img
                src="/Barberia.jpg"
                alt="Herramientas y espacio de trabajo de Sr. Bigote"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-6 -left-6 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-block">
              <span className="text-primary font-semibold tracking-widest uppercase text-sm">La barbería</span>
              <div className="h-1 w-12 bg-primary mt-2" />
            </div>

            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Un corte pensado <br />
              <span className="text-muted-foreground">para vos.</span>
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              En Sr. Bigote nos tomamos el tiempo de entender qué buscás antes de empezar. Trabajamos cada corte según tu pelo, tu estilo y el mantenimiento que quieras darle en casa.
            </p>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Hacemos cortes clásicos y actuales, perfilado de barba y servicio de navaja. Sin apuros, sin fórmulas repetidas y con recomendaciones claras para que el resultado te siga quedando bien después de salir.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-8">
              <div>
                <h3 className="text-3xl font-bold text-white">A medida</h3>
                <p className="text-muted-foreground text-sm">Cada corte empieza con una charla</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white">Sin espera</h3>
                <p className="text-muted-foreground text-sm">Reservá tu horario online</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
