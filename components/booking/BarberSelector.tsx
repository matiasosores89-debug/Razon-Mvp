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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {barbers.map((barber) => (
        <motion.div
          key={barber.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(barber.id)}
          className={`cursor-pointer relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
            selectedBarberId === barber.id
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-white/5 hover:border-white/20"
          }`}
        >
          {selectedBarberId === barber.id && (
            <div className="absolute top-4 right-4 bg-primary text-luxury-black rounded-full p-1">
              <Check size={16} className="font-bold" />
            </div>
          )}

          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-2 ring-primary/30 group-hover:ring-primary transition-all">
              <img
                src={barber.image}
                alt={barber.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                }}
              />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{barber.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{barber.specialty}</p>
            <div className="text-primary text-xs font-medium uppercase tracking-wider">
              {barber.experience} años de experiencia
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
