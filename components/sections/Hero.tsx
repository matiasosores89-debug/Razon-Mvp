"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-luxury-black"
    >
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/60 via-luxury-black/40 to-luxury-black z-10" />
        <img
          src="/background2.jpg"
          alt="Interior de la barbería Sr. Bigote"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 pb-16 pt-24 text-center sm:px-6 sm:pb-0 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="mb-5 text-4xl font-bold leading-[1.05] tracking-tighter text-white sm:text-5xl md:mb-6 md:text-7xl lg:text-8xl">
            UN BUEN CORTE <br />
            <span className="text-primary italic">CAMBIA TODO</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:mb-10 md:text-xl"
          >
            Corte, barba y asesoramiento para que salgas como querías. Elegí tu barbero, reservá online y vení a la hora que te quede cómoda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild variant="primary" size="lg" className="w-full sm:w-auto font-bold px-10">
              <Link href="/booking">Reservar turno</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10 px-10">
              <Link href="#about">Conocer la barbería</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.a
        href="#about"
        aria-label="Explorar la barbería"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground sm:flex md:bottom-10"
      >
        <span className="text-xs uppercase tracking-widest font-medium">Explorar</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown size={24} className="text-primary" />
        </motion.div>
      </motion.a>
    </section>
  );
};
