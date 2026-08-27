"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

import Link from "next/link";

export const CTA = () => {
  return (
    <section id="contact" className="py-24 bg-luxury-black relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter leading-tight">
            ¿Listo para elevar <br />
            <span className="text-primary italic">tu estilo?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            No esperes más para experimentar el mejor servicio de todo tucuman.
          </p>
          <Link href="/booking">
            <Button variant="primary" size="lg" className="font-bold px-12 py-6 text-xl rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Reservar Turno Ahora
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
