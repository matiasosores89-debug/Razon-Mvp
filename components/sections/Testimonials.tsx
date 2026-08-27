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
    text: "La atención al detalle es increíble. Nunca había tenido un corte tan preciso. El ambiente es relajante y el servicio es de primera clase.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Andrés Villalobos",
    rating: 5,
    text: "Un lugar donde realmente entienden lo que quieres. El afeitado imperial es una experiencia que todo hombre debería probar.",
    image: "https://images.unsplash.com/photo-1492562080023-a3668f738407?q=80&w=207//auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Rodrigo Paz",
    rating: 4,
    text: "Excelente servicio y barberos muy profesionales. Me encantó el trato y la calidad de los productos que utilizan.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-luxury-dark relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold tracking-widest uppercase text-sm">Experiencias</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 tracking-tight">
              Lo que Dicen Nuestros Clientes
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <p className="text-xs text-muted-foreground">Cliente VIP</p>
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
