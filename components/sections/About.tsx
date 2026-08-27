"use client";

import React from "react";
import { motion } from "framer-motion";

export const About = () => {
  return (
    <section id="about" className="py-24 bg-luxury-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
                alt="Barber tools"
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
              <span className="text-primary font-semibold tracking-widest uppercase text-sm">Nuestra Historia</span>
              <div className="h-1 w-12 bg-primary mt-2" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Tradición Renovada <br />
              <span className="text-muted-foreground">estilo atemporal.</span>
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Fundada sobre los principios de la barbería clásica, Sr.bigote nace de la pasión por el detalle y el respeto por el oficio. No somos solo un lugar para cortarse el cabello; somos un santuario de cuidado personal.
            </p>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Nuestra filosofía es simple: combinar la técnica ancestral de la navaja y la toalla caliente con las tendencias más vanguardistas del diseño masculino. Cada cliente es una obra única, y cada servicio es una búsqueda de la simetría perfecta.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <h3 className="text-3xl font-bold text-white">10+</h3>
                <p className="text-muted-foreground text-sm">Años de Experiencia</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white">5k+</h3>
                <p className="text-muted-foreground text-sm">Clientes Satisfechos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
