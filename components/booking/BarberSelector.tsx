"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Barber } from "@/types";
import { Check } from "lucide-react";

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarberId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const BarberSelector = ({ barbers, selectedBarberId, onSelect, isLoading }: BarberSelectorProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-4">
      {barbers.map((barber) => (
        <motion.div
          key={barber.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(barber.id)}
          className={`group relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 sm:p-6 ${
            selectedBarberId === barber.id
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-white/5 hover:border-white/20"
          }`}
        >
          {selectedBarberId === barber.id && (
            <div className="absolute right-3 top-3 rounded-full bg-primary p-1 text-luxury-black sm:right-4 sm:top-4">
              <Check size={16} className="font-bold" />
            </div>
          )}

          <div className="flex items-center gap-4 text-left sm:flex-col sm:text-center">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/30 transition-all group-hover:ring-primary sm:mb-4 sm:h-24 sm:w-24">
              <img
                src={barber.image}
                alt={barber.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                }}
              />
            </div>
            <div className="min-w-0 pr-8 sm:pr-0">
            <h3 className="mb-1 text-base font-bold text-white sm:text-xl">{barber.name}</h3>
            <p className="mb-2 text-sm text-muted-foreground sm:mb-4">{barber.specialty}</p>
            <div className="text-[11px] font-medium uppercase tracking-wider text-primary sm:text-xs">
              {barber.experience} años de experiencia
            </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
