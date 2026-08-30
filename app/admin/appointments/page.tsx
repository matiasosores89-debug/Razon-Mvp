"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, Plus, Edit2, Trash2, X, ChevronDown, MoreVertical, ArrowUp, ArrowDown, CalendarClock, Save } from "lucide-react";
import { formatForShopDateTimeInput, getShopDateString, SHOP_TIME_ZONE, shopLocalDateTimeToIso } from "@/lib/datetime";

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
type DateScope = "all" | "today";
type SortOrder = "asc" | "desc";
type ActionMenuPosition = { top: number; left: number };

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
  const [dateScope, setDateScope] = useState<DateScope>("today");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuPosition | null>(null);

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
  }, []);

  useEffect(() => {
    if (!openActionMenu) return;

    const closeActionMenu = () => {
      setOpenActionMenu(null);
      setActionMenuPosition(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeActionMenu();
    };

    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionMenu]);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const toggleActionMenu = (
    id: string,
    status: Appointment["status"],
    button: HTMLButtonElement
  ) => {
    if (openActionMenu === id) {
      setOpenActionMenu(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 208;
    // Scheduled appointments show four actions; every other status only shows delete.
    // Use the actual menu height so short menus are not unnecessarily moved above the row.
    const menuHeight = status === "SCHEDULED" ? 190 : 58;
    const viewportPadding = 12;
    const gap = 8;
    const fitsBelow = rect.bottom + gap + menuHeight <= window.innerHeight - viewportPadding;

    setActionMenuPosition({
      top: fitsBelow
        ? rect.bottom + gap
        : Math.max(viewportPadding, rect.top - menuHeight - gap),
      left: Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - menuWidth)
      ),
    });
    setOpenActionMenu(id);
  };

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

  const today = getShopDateString();
  const filteredAppointments = appointments
    .filter(app => {
      const matchesSearch = app.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                            app.customer.phone.includes(filters.search);
      const matchesStatus = filters.status === "" || app.status === filters.status;
      const matchesDate = dateScope === "all" || getShopDateString(new Date(app.startTime)) === today;
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const difference = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      return sortOrder === "asc" ? difference : -difference;
    });

  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "SCHEDULED", label: "Programados" },
    { value: "COMPLETED", label: "Completados" },
    { value: "CANCELLED", label: "Cancelados" },
    { value: "NO_SHOW", label: "Ausentes" },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestión de Turnos</h2>
          </div>
          <Button onClick={openCreateModal} className="shrink-0 bg-primary text-luxury-black hover:bg-primary/90 font-semibold flex items-center gap-2">
            <Plus size={17} /> Nuevo turno
          </Button>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
          <div className="order-2 inline-flex h-10 rounded-lg border border-white/10 bg-luxury-black/40 p-1 sm:flex-none" aria-label="Filtrar turnos por fecha">
            {([
              { value: "all", label: "Todos" },
              { value: "today", label: "Hoy" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={dateScope === option.value}
                onClick={() => setDateScope(option.value)}
                className={cn(
                  "flex-1 rounded-md px-4 text-sm font-medium transition-colors sm:flex-none",
                  dateScope === option.value
                    ? "bg-primary text-luxury-black"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(current => current === "asc" ? "desc" : "asc")}
            className="order-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-luxury-black/40 px-3 text-sm font-medium text-white transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:flex-none"
            aria-label={`Ordenar por hora: ${sortOrder === "asc" ? "más temprano primero" : "más tarde primero"}`}
          >
            {sortOrder === "asc" ? <ArrowUp size={16} className="text-primary" /> : <ArrowDown size={16} className="text-primary" />}
            {sortOrder === "asc" ? "Más temprano" : "Más tarde"}
          </button>

          <div className="relative order-1 min-w-0 flex-1 sm:basis-full lg:basis-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              type="search"
              aria-label="Buscar cliente"
              placeholder={"Buscar por nombre o tel\u00e9fono..."}
              className="h-10 w-full rounded-lg border border-white/10 bg-luxury-black/40 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="relative order-3 min-w-0 flex-1 sm:w-44 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={cn(
                "flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                filters.status
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-luxury-black/40 border-white/10 text-white hover:bg-white/5"
              )}
            >
              <span className="truncate text-left">
                {statusOptions.find(opt => opt.value === filters.status)?.label || "Todos los estados"}
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
                            type="button"
                            aria-label="Cambiar estado del turno"
                            aria-expanded={openActionMenu === app.id}
                            onClick={(event) => toggleActionMenu(app.id, app.status, event.currentTarget)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors border",
                              openActionMenu === app.id
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
                            )}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openActionMenu === app.id && actionMenuPosition && createPortal(
                            <div
                              role="menu"
                              aria-label="Opciones del turno"
                              className="fixed z-[120] w-52 overflow-hidden rounded-2xl border border-white/10 bg-luxury-grey py-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
                              style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                            >
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
                            </div>,
                            document.body
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

      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-modal-title"
            className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#191919] shadow-[0_32px_90px_rgba(0,0,0,0.65)] sm:max-h-[calc(100dvh-3rem)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <CalendarClock size={19} />
                </div>
                <div className="min-w-0">
                  <h3 id="appointment-modal-title" className="text-lg font-semibold tracking-tight text-white">
                    {modalMode === "create" ? "Nuevo turno" : "Editar turno"}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {modalMode === "create" ? "Completá los datos de la reserva." : "Actualizá los datos o el estado de la reserva."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <X size={19} />
              </button>
            </header>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveAppointment(); }} className="flex min-h-0 flex-1 flex-col">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-5 gap-y-4 overflow-y-auto px-6 py-5 sm:grid-cols-2 sm:px-7">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Cliente</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar o escribir nombre..."
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && customerSearch && (
                      <div className="absolute z-50 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#202020] py-1 shadow-2xl">
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
                              className="w-full border-b border-white/5 px-3.5 py-2.5 text-left text-sm transition-colors last:border-none hover:bg-white/5"
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
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Barbero</label>
                  <select
                    required
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
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
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
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
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 [color-scheme:dark]"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Estado</label>
                  <select
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Appointment["status"] }))}
                  >
                    <option value="SCHEDULED" className="bg-luxury-black">Programado</option>
                    <option value="COMPLETED" className="bg-luxury-black">Completado</option>
                    <option value="CANCELLED" className="bg-luxury-black">Cancelado</option>
                    <option value="NO_SHOW" className="bg-luxury-black">Ausente</option>
                  </select>
                </div>

              </div>
              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-black/10 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-10 px-4 text-zinc-300 hover:bg-white/5 hover:text-white">
                  Cancelar
                </Button>
                <Button type="submit" className="h-10 gap-2 bg-primary px-5 font-semibold text-luxury-black hover:bg-primary/90">
                  {modalMode === "edit" && <Save size={16} />}
                  {modalMode === "create" ? "Crear turno" : "Guardar cambios"}
                </Button>
              </footer>
            </form>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
