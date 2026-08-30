"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

import Link from "next/link";

export const CTA = () => {
  return (
    <section id="contact" className="relative overflow-hidden bg-luxury-black py-16 sm:py-20 md:py-24">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="mb-6 text-3xl font-bold leading-tight tracking-tighter text-white sm:text-4xl md:mb-8 md:text-6xl">
            ¿Hace falta un corte? <br />
            <span className="text-primary italic">Reservá en un minuto.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Mirá los horarios disponibles y elegí el que mejor te quede. Sin llamadas ni mensajes de ida y vuelta.
          </p>
          <Link href="/booking">
            <Button variant="primary" size="lg" className="font-bold px-12 py-6 text-xl rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Ver horarios disponibles
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
