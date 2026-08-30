"use client";

import React from "react";
import { motion } from "framer-motion";
import { Service } from "@/types";
import { Check, Scissors } from "lucide-react";

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const ServiceSelector = ({ services, selectedServiceId, onSelect, isLoading }: ServiceSelectorProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {services.map((service) => (
        <motion.div
          key={service.id}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(service.id)}
          className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 sm:p-5 ${
            selectedServiceId === service.id
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-white/5 hover:border-white/20"
          }`}
        >
          {selectedServiceId === service.id && (
            <div className="absolute top-4 right-4 bg-primary text-luxury-black rounded-full p-1">
              <Check size={16} className="font-bold" />
            </div>
          )}

          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`shrink-0 rounded-lg p-2.5 sm:p-3 ${selectedServiceId === service.id ? "bg-primary text-luxury-black" : "bg-white/10 text-primary"}`}>
              <Scissors size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-col gap-1 pr-7 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pr-0">
                <h3 className="text-base font-bold leading-tight text-white sm:text-lg">{service.title}</h3>
                <span className="shrink-0 font-bold text-primary">${service.price}</span>
              </div>
              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                {service.description}
              </p>
              <div className="text-white/40 text-xs font-medium">
                Duración: {service.duration} min
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
