"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Testimonial } from "@/types";

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    rating: 5,
    text: "Le mostré una foto de referencia y me explicaron qué iba a funcionar con mi pelo. Quedó tal cual lo habíamos hablado.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Andrés Villalobos",
    rating: 5,
    text: "Reservé desde el celular y me atendieron a horario. Buen corte, buena charla y cero vueltas.",
    image: "https://images.unsplash.com/photo-1492562080023-a3668f738407?q=80&w=207//auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Rodrigo Paz",
    rating: 4,
    text: "Fui por corte y barba. Se tomaron el tiempo necesario y me explicaron cómo mantenerlo en casa.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="relative bg-luxury-dark py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold tracking-widest uppercase text-sm">Opiniones</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Lo cuentan quienes ya vinieron
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 bg-luxury-black border border-border rounded-2xl relative"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={cn(i < item.rating ? "text-primary fill-primary" : "text-muted-foreground")}
                  />
                ))}
              </div>
              <p className="text-muted-foreground italic mb-8 leading-relaxed">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                />
                <div>
                  <h4 className="text-white font-bold">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">Cliente de Sr. Bigote</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
