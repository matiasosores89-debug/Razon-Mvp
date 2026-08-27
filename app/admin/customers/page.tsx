"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Search, Loader2, User } from "lucide-react";

interface CustomerStats {
  id: string;
  name: string;
  phone: string;
  email: string;
  completedAppointments: number;
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "" });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const result = await res.json();
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (e) {
      console.error("Error fetching customers", e);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    c.phone.includes(filters.search) ||
    c.email?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Clientes</h2>
          <p className="text-muted-foreground text-sm">Lista de clientes y su historial de asistencia</p>
        </div>

        <div className="flex flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-luxury-grey border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Turnos Completados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin" size={20} />
                      Cargando clientes...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User size={16} />
                        </div>
                        <span className="text-white font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {customer.email || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        {customer.completedAppointments}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
