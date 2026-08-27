"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, Plus, Edit2, Trash2, X, ChevronDown, MoreVertical } from "lucide-react";
import { formatForShopDateTimeInput, SHOP_TIME_ZONE, shopLocalDateTimeToIso } from "@/lib/datetime";

interface Appointment {
  id: string;
  startTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  barber: { id: string; name: string };
  customer: { id: string; name: string; phone: string };
  service: { id: string; title: string; price: string };
}

interface Barber { id: string; name: string; }
interface Service { id: string; title: string; price: string; }
interface Customer { id: string; name: string; phone: string; }

const StatusBadge = ({ status }: { status: Appointment["status"] }) => {
  const configs = {
    SCHEDULED: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Programado" },
    COMPLETED: { color: "bg-green-500/10 text-green-500 border-green-500/20", label: "Completado" },
    CANCELLED: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Cancelado" },
    NO_SHOW: { color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", label: "Ausente" },
  };
  const config = configs[status];
  return (
    <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase border", config.color)}>
      {config.label}
    </span>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    customerPhone: "",
    barberId: "",
    serviceId: "",
    startTime: "",
    status: "SCHEDULED" as Appointment["status"]
  });

  // Options for form
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchOptions();
  }, [filters]);

  async function fetchAppointments() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/appointments");
      const result = await res.json();
      if (result.success) setAppointments(result.data);
    } catch (e) {
      console.error("Error fetching appointments", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchOptions() {
    try {
      const [bRes, sRes, cRes] = await Promise.all([
        fetch("/api/barbers"),
        fetch("/api/services"),
        fetch("/api/customers"),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();

      if (bData.success) setBarbers(bData.data);
      if (sData.success) setServices(sData.data);
      if (cData.success) setCustomers(cData.data);
    } catch (e) {
      console.error("Error fetching options", e);
    }
  }

  async function updateStatus(id: string, status: Appointment["status"]) {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      }
    } catch (e) {
      console.error("Error updating status", e);
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este turno?")) return;
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setAppointments(prev => prev.filter(app => app.id !== id));
      }
    } catch (e) {
      console.error("Error deleting appointment", e);
    }
  }

  async function handleSaveAppointment() {
    try {
      const method = modalMode === "create" ? "POST" : "PATCH";
      const url = modalMode === "create" ? "/api/admin/appointments" : `/api/admin/appointments/${selectedAppointment?.id}`;

      // datetime-local has no zone; appointments always use the shop's zone.
      const formattedStartTime = formData.startTime
        ? shopLocalDateTimeToIso(formData.startTime)
        : formData.startTime;

      const body = {
        ...formData,
        startTime: formattedStartTime,
        customerName: customerSearch,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.success) {
        setIsModalOpen(false);
        fetchAppointments();
      } else {
        const errorMessage = result.error?.message || result.message || "No se pudo guardar el turno";
        alert(`Error: ${errorMessage}`);
      }
    } catch (e) {
      console.error("Error saving appointment", e);
      alert("Ocurrió un error inesperado al guardar el turno");
    }
  }

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ customerId: "", customerPhone: "", barberId: "", serviceId: "", startTime: "", status: "SCHEDULED" });
    setIsModalOpen(true);
  };

  const openEditModal = (app: Appointment) => {
    setModalMode("edit");
    setSelectedAppointment(app);
    setFormData({
      customerId: app.customer.id,
      customerPhone: app.customer.phone,
      barberId: app.barber.id,
      serviceId: app.service.id,
      startTime: formatForShopDateTimeInput(app.startTime),
      status: app.status,
    });
    setCustomerSearch(app.customer.name);
    setIsModalOpen(true);
  };

  const filteredAppointments = appointments
    .filter(app => {
      const matchesSearch = app.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                            app.customer.phone.includes(filters.search);
      const matchesStatus = filters.status === "" || app.status === filters.status;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "SCHEDULED", label: "Programados" },
    { value: "COMPLETED", label: "Completados" },
    { value: "CANCELLED", label: "Cancelados" },
    { value: "NO_SHOW", label: "Ausentes" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestión de Turnos</h2>
          </div>
          <Button onClick={openCreateModal} className="bg-primary text-luxury-black hover:bg-primary/90 font-bold flex items-center gap-2">
            <Plus size={18} /> Nuevo Turno
          </Button>
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
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={cn(
                "w-full md:w-auto flex items-center justify-between gap-3 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
                filters.status
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
            >
              <span className="min-w-[120px] text-left">
                {statusOptions.find(opt => opt.value === filters.status)?.label || "Todos los Estados"}
              </span>
              <ChevronDown size={16} className={cn("transition-transform duration-200", isStatusOpen ? "rotate-180" : "")} />
            </button>

            {isStatusOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-luxury-grey border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, status: opt.value }));
                      setIsStatusOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                      filters.status === opt.value
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    {opt.label}
                    {filters.status === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-luxury-grey border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Barbero</th>
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin" size={20} />
                      Cargando turnos...
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No se encontraron turnos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{app.customer.name}</span>
                        <span className="text-muted-foreground text-xs">{app.customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {app.barber.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white text-sm">{app.service.title}</span>
                        <span className="text-primary text-xs font-medium">${Number(app.service.price).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white text-sm">
                      {new Date(app.startTime).toLocaleString('es-AR', {
                        timeZone: SHOP_TIME_ZONE,
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:bg-blue-400/10 h-8 px-3"
                          onClick={() => openEditModal(app)}
                        >
                          <Edit2 size={14} className="mr-1" /> Editar
                        </Button>

                        <div className="relative">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === app.id ? null : app.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors border",
                              openActionMenu === app.id
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
                            )}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openActionMenu === app.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-luxury-grey border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                              {app.status === "SCHEDULED" && (
                                <>
                                  <button
                                    onClick={() => { updateStatus(app.id, "COMPLETED"); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-green-500 hover:bg-green-500/10 transition-colors flex items-center gap-2"
                                  >
                                    <CheckCircle size={14} /> Marcar Atendido
                                  </button>
                                  <button
                                    onClick={() => { updateStatus(app.id, "NO_SHOW"); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-400/10 transition-colors flex items-center gap-2"
                                  >
                                    <AlertCircle size={14} /> Marcar Ausente
                                  </button>
                                  <button
                                    onClick={() => { updateStatus(app.id, "CANCELLED"); setOpenActionMenu(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                                  >
                                    <XCircle size={14} /> Cancelar Turno
                                  </button>
                                  <div className="my-1 border-t border-white/5" />
                                </>
                              )}
                              <button
                                onClick={() => { handleDelete(app.id); setOpenActionMenu(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Eliminar Turno
                              </button>
                            </div>
                          )}
                        </div>
                        {isUpdating === app.id && <Loader2 className="animate-spin text-primary" size={16} />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-luxury-grey border border-white/10 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[95vh] my-auto">
            <div className="flex justify-between items-center p-8 pb-4">
              <h3 className="text-xl font-bold text-white">
                {modalMode === "create" ? "Nuevo Turno" : "Editar Turno"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAppointment(); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Cliente</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar o escribir nombre..."
                      className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && customerSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-luxury-grey border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {customers
                          .filter(c =>
                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone.includes(customerSearch)
                          )
                          .map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, customerId: c.id, customerPhone: c.phone }));
                                setCustomerSearch(c.name);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-none"
                            >
                              <div className="flex flex-col">
                                <span className="text-white font-medium">{c.name}</span>
                                <span className="text-muted-foreground text-xs">{c.phone}</span>
                              </div>
                            </button>
                          ))}
                        {customers.filter(c =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone.includes(customerSearch)
                        ).length === 0 && (
                          <div className="px-4 py-3 text-xs text-muted-foreground italic">
                            No se encontraron clientes.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Teléfono</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: +54 9 11..."
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Barbero</label>
                  <select
                    required
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.barberId}
                    onChange={(e) => setFormData(prev => ({ ...prev, barberId: e.target.value }))}
                  >
                    <option value="">Seleccionar Barbero</option>
                    {barbers.map(b => <option key={b.id} value={b.id} className="bg-luxury-black">{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Servicio</label>
                  <select
                    required
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.serviceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  >
                    <option value="">Seleccionar Servicio</option>
                    {services.map(s => <option key={s.id} value={s.id} className="bg-luxury-black">{s.title} (${s.price})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Fecha y Hora</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Estado</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Appointment["status"] }))}
                  >
                    <option value="SCHEDULED" className="bg-luxury-black">Programado</option>
                    <option value="COMPLETED" className="bg-luxury-black">Completado</option>
                    <option value="CANCELLED" className="bg-luxury-black">Cancelado</option>
                    <option value="NO_SHOW" className="bg-luxury-black">Ausente</option>
                  </select>
                </div>

                <Button type="submit" className="w-full bg-primary text-luxury-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all mt-4">
                  {modalMode === "create" ? "Crear Turno" : "Guardar Cambios"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
