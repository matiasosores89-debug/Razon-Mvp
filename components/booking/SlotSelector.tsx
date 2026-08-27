"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Calendar as CalendarIcon, Clock } from "lucide-react";
import { SHOP_TIME_ZONE, shopDateTime } from "@/lib/datetime";

interface Slot {
  startTime: string;
  endTime: string;
}

interface SlotSelectorProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  slots: Slot[];
  selectedSlot: string | null;
  onSelectSlot: (startTime: string) => void;
  isLoading: boolean;
}

export const SlotSelector = ({
  selectedDate,
  setSelectedDate,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading
}: SlotSelectorProps) => {

  const formatDate = (dateStr: string) => {
    return shopDateTime(dateStr, "12:00").toLocaleDateString('es-AR', {
      timeZone: SHOP_TIME_ZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-AR', {
      timeZone: SHOP_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        <label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <CalendarIcon size={16} /> Selecciona la fecha
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <p className="text-white/60 text-sm italic">
          {selectedDate ? formatDate(selectedDate) : "Por favor selecciona un día"}
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <Clock size={16} /> Horarios disponibles
        </label>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-muted-foreground">No hay turnos disponibles para este día.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot, index) => (
              <motion.button
                type="button"
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectSlot(slot.startTime)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${
                  selectedSlot === slot.startTime
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 text-white hover:border-white/20"
                }`}
              >
                {formatTime(slot.startTime)}
                {selectedSlot === slot.startTime && (
                  <div className="absolute -top-2 -right-2 bg-primary text-luxury-black rounded-full p-1">
                    <Check size={12} className="font-bold" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
