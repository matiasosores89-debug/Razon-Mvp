"use client";

import React from "react";
import { User, Phone, Mail } from "lucide-react";

interface CustomerFormProps {
  formData: {
    name: string;
    phone: string;
    email: string;
  };
  onChange: (field: string, value: string) => void;
  errors: any;
}

export const CustomerForm = ({ formData, onChange, errors }: CustomerFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <User size={16} /> Nombre Completo
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Ej: Juan Pérez"
            className={`w-full bg-white/5 border ${errors?.name ? "border-red-500" : "border-white/10"} text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          />
        </div>
        {errors?.name && <p className="text-red-500 text-xs">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <Phone size={16} /> Teléfono
        </label>
        <div className="relative">
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Ej: 381 1234567"
            className={`w-full bg-white/5 border ${errors?.phone ? "border-red-500" : "border-white/10"} text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          />
        </div>
        {errors?.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <Mail size={16} /> Email
        </label>
        <div className="relative">
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="ejemplo@correo.com"
            className={`w-full bg-white/5 border ${errors?.email ? "border-red-500" : "border-white/10"} text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          />
        </div>
        {errors?.email && <p className="text-red-500 text-xs">{errors.email}</p>}
      </div>
    </div>
  );
};
