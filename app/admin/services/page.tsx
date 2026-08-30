"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Clock3, Edit2, Loader2, Plus, Save, Scissors, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Barber = { id: string; name: string };
type Service = {
  id: string;
  title: string;
  description: string | null;
  price: string;
  duration: number;
  isActive: boolean;
  barbers: Array<{ barber: Barber }>;
  _count: { appointments: number };
};
type FormState = { title: string; description: string; price: string; duration: string; isActive: boolean; barberIds: string[] };

const emptyForm: FormState = { title: "", description: "", price: "", duration: "30", isActive: true, barberIds: [] };
const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  async function loadCatalog() {
    try {
      const result = await (await fetch("/api/admin/services", { cache: "no-store" })).json();
      if (!result.success) throw new Error(result.message || "No se pudieron cargar los servicios");
      setServices(result.data.services);
      setBarbers(result.data.barbers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los servicios");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadCatalog(); }, []);
  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setModalOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [modalOpen]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, barberIds: barbers.map((barber) => barber.id) });
    setError("");
    setModalOpen(true);
  }

  function openEdit(service: Service) {
    setEditingId(service.id);
    setForm({ title: service.title, description: service.description ?? "", price: service.price, duration: String(service.duration), isActive: service.isActive, barberIds: service.barbers.map((item) => item.barber.id) });
    setError("");
    setModalOpen(true);
  }

  function toggleBarber(id: string) {
    setForm((current) => ({ ...current, barberIds: current.barberIds.includes(id) ? current.barberIds.filter((barberId) => barberId !== id) : [...current.barberIds, id] }));
  }

  async function saveService(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const price = Number(form.price);
    const duration = Number(form.duration);
    if (form.title.trim().length < 2 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(duration) || duration <= 0) {
      setError("Revisá el nombre, el precio y la duración del servicio.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(editingId ? `/api/admin/services/${editingId}` : "/api/admin/services", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() || undefined, price, duration, isActive: form.isActive, barberIds: form.barberIds }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || result.message || "No se pudo guardar el servicio");
      setModalOpen(false);
      await loadCatalog();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    setError("");
    try {
      const result = await (await fetch(`/api/admin/services/${service.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !service.isActive }) })).json();
      if (!result.success) throw new Error(result.error?.message || "No se pudo actualizar el servicio");
      await loadCatalog();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No se pudo actualizar el servicio");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catálogo</p><h1 className="text-3xl font-semibold tracking-tight text-white">Servicios</h1><p className="mt-2 text-sm text-zinc-500">Administrá lo que ofrece la barbería y quién puede realizar cada servicio.</p></div>
        <button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-black transition-colors hover:bg-primary/90"><Plus size={16} /> Nuevo servicio</button>
      </header>

      {error && !modalOpen && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-luxury-grey md:rounded-3xl">
        <div className="overflow-x-auto">
          <table className="mobile-card-table services-table w-full text-left md:min-w-[760px]">
            <thead className="border-b border-white/[0.06] bg-white/[0.025] text-xs font-semibold uppercase tracking-wider text-zinc-500"><tr><th className="px-6 py-4">Servicio</th><th className="px-6 py-4">Precio</th><th className="px-6 py-4">Duración</th><th className="px-6 py-4">Barberos</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-white/[0.06]">
              {isLoading ? <tr><td colSpan={6} className="px-6 py-14 text-center text-sm text-zinc-500"><Loader2 className="mx-auto mb-2 animate-spin text-primary" /> Cargando servicios...</td></tr>
              : services.length === 0 ? <tr><td colSpan={6} className="px-6 py-14 text-center"><Scissors className="mx-auto mb-3 text-zinc-600" /><p className="text-sm text-zinc-400">Todavía no hay servicios cargados.</p></td></tr>
              : services.map((service) => <tr key={service.id} className={cn("transition-colors hover:bg-white/[0.025]", !service.isActive && "opacity-55")}>
                <td className="px-6 py-4"><p className="font-medium text-white">{service.title}</p><p className="mt-1 max-w-xs truncate text-xs text-zinc-500">{service.description || "Sin descripción"}</p></td>
                <td className="px-6 py-4 font-semibold text-primary tabular-nums">${Number(service.price).toLocaleString("es-AR")}</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 text-sm text-zinc-400"><Clock3 size={14} /> {service.duration} min</span></td>
                <td className="px-6 py-4 text-sm text-zinc-400">{service.barbers.length === 0 ? "Sin asignar" : service.barbers.length === barbers.length ? "Todo el equipo" : `${service.barbers.length} de ${barbers.length}`}</td>
                <td className="px-6 py-4"><button type="button" onClick={() => toggleActive(service)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors", service.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15" : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10")}>{service.isActive ? "Activo" : "Inactivo"}</button></td>
                <td className="px-6 py-4 text-right"><button type="button" onClick={() => openEdit(service)} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"><Edit2 size={14} /> Editar</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && createPortal(<div className="fixed inset-0 z-[200] flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="service-modal-title" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#191919] shadow-2xl sm:my-auto sm:rounded-2xl">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Scissors size={18} /></div><div><h2 id="service-modal-title" className="text-lg font-semibold text-white">{editingId ? "Editar servicio" : "Nuevo servicio"}</h2><p className="mt-0.5 text-xs text-zinc-500">Definí precio, duración y disponibilidad.</p></div></div><button type="button" aria-label="Cerrar" onClick={() => setModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white"><X size={19} /></button></header>
          <form onSubmit={saveService}>
            <div className="grid overflow-y-auto gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6">
              <Field label="Nombre"><input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Color y corte" className={inputClass} /></Field>
              <Field label="Estado"><select value={form.isActive ? "active" : "inactive"} onChange={(event) => setForm({ ...form, isActive: event.target.value === "active" })} className={inputClass}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></Field>
              <Field label="Precio"><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">$</span><input required type="number" min="1" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="15000" className={cn(inputClass, "pl-8")} /></div></Field>
              <Field label="Duración"><div className="relative"><input required type="number" min="5" step="5" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className={cn(inputClass, "pr-14")} /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span></div></Field>
              <div className="sm:col-span-2"><Field label="Descripción"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={500} rows={3} placeholder="Contá brevemente qué incluye el servicio." className={cn(inputClass, "h-auto resize-none py-3")} /></Field></div>
              <div className="sm:col-span-2"><p className="mb-2 text-xs font-medium text-zinc-400">Barberos habilitados</p><div className="grid gap-2 sm:grid-cols-2">{barbers.map((barber) => { const selected = form.barberIds.includes(barber.id); return <button key={barber.id} type="button" onClick={() => toggleBarber(barber.id)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors", selected ? "border-primary/25 bg-primary/[0.07] text-white" : "border-white/[0.08] text-zinc-500 hover:border-white/15")}><span className={cn("flex h-5 w-5 items-center justify-center rounded border", selected ? "border-primary bg-primary text-black" : "border-white/15")}>{selected && <Check size={13} />}</span>{barber.name}</button>; })}</div>{form.barberIds.length === 0 && <p className="mt-2 text-xs text-amber-400">El servicio no aparecerá en las reservas hasta asignarlo a un barbero.</p>}</div>
              {error && <div className="sm:col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>}
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} className="h-10 rounded-lg px-4 text-sm font-medium text-zinc-300 hover:bg-white/5">Cancelar</button><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-black hover:bg-primary/90 disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editingId ? "Guardar cambios" : "Crear servicio"}</button></footer>
          </form>
        </section>
      </div>, document.body)}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="block text-xs font-medium text-zinc-400">{label}</span>{children}</label>;
}
