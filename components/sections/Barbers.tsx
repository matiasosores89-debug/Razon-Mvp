"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Barber } from "@/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const Barbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBarbers() {
      try {
        const res = await fetch("/api/barbers");
        const result = await res.json();
        if (result.success) {
          setBarbers(result.data);
        }
      } catch (error) {
        console.error("Error fetching barbers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBarbers();
  }, []);

  if (isLoading) {
    return (
      <section id="barbers" className="relative bg-luxury-dark py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section id="barbers" className="relative bg-luxury-dark py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold tracking-widest uppercase text-sm">El equipo</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Elegí quién te corta
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Conocé la especialidad de cada barbero y reservá directamente con el que mejor encaje con tu estilo.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-4 md:gap-8">
          {barbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-luxury-grey border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={barber.image || "/barbero1.jpg"}
                  alt={barber.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <div className="p-6 relative">
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                  {barber.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">{barber.specialty}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                    {barber.experience} años de experiencia
                  </span>
                </div>
                <Link href={`/booking?barberId=${barber.id}`}>
                  <Button variant="outline" className="w-full mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-semibold">
                    Reservar con {barber.name.split(" ")[0]}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
