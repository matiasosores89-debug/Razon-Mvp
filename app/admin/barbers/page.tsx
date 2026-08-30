"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Calendar, CheckCircle2, Edit2, ImagePlus, Loader2, Plus, Save, Scissors, Trash2, TrendingUp, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOP_TIME_ZONE } from "@/lib/datetime";

interface Barber { id: string; name: string; specialty: string; experience: number; image?: string | null; isActive: boolean; completedToday: number; totalAppointments: number; }
interface Appointment { id: string; startTime: string; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; customer: { name: string }; service: { title: string }; }
interface BarberDetails {
  barber: Barber;
  history: Appointment[];
  services: Array<{ serviceId: string; title: string; count: number; percentage: number }>;
  totalCompleted: number;
  totalAppointments: number;
  period: { month: number; year: number };
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const now = new Date();
const emptyBarberForm = { name: "", specialty: "", experience: "0", image: "", isActive: true };
const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [details, setDetails] = useState<BarberDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [barberForm, setBarberForm] = useState(emptyBarberForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  useEffect(() => { fetchBarbers(); }, []);
  useEffect(() => {
    if (!selectedBarberId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelectedBarberId(null); setDetails(null); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [selectedBarberId]);
  useEffect(() => {
    if (!formModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setFormModalOpen(false); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [formModalOpen]);

  async function fetchBarbers() {
    try {
      setIsLoading(true);
      const result = await (await fetch("/api/admin/barbers")).json();
      if (result.success) setBarbers(result.data);
    } catch (error) { console.error("Error fetching barbers:", error); }
    finally { setIsLoading(false); }
  }

  async function fetchDetails(id: string, month: number, year: number) {
    try {
      setIsLoadingDetails(true);
      const result = await (await fetch(`/api/admin/barbers/${id}?month=${month}&year=${year}`)).json();
      if (result.success) setDetails(result.data);
    } catch (error) { console.error("Error fetching barber details:", error); }
    finally { setIsLoadingDetails(false); }
  }

  const openDetails = (id: string) => {
    setSelectedBarberId(id);
    setDetails(null);
    fetchDetails(id, Number(filterMonth), Number(filterYear));
  };
  const closeModal = () => { setSelectedBarberId(null); setDetails(null); };

  const openCreate = () => {
    setEditingBarberId(null);
    setBarberForm(emptyBarberForm);
    setFormError("");
    setSelectedImage(null);
    setImagePreview("");
    setFormModalOpen(true);
  };

  const openEdit = (barber: Barber) => {
    setEditingBarberId(barber.id);
    setBarberForm({ name: barber.name, specialty: barber.specialty, experience: String(barber.experience), image: barber.image ?? "", isActive: barber.isActive });
    setFormError("");
    setSelectedImage(null);
    setImagePreview(barber.image ?? "");
    setFormModalOpen(true);
  };

  function chooseImage(file?: File) {
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setFormError("La imagen debe estar en formato JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("La imagen no puede superar los 5 MB.");
      return;
    }
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError("");
  }

  function removeImage() {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");
    setBarberForm((current) => ({ ...current, image: "" }));
  }

  function closeFormModal() {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");
    setFormModalOpen(false);
  }

  async function saveBarber(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    const experience = Number(barberForm.experience);
    if (barberForm.name.trim().length < 2 || barberForm.specialty.trim().length < 2 || !Number.isInteger(experience) || experience < 0) {
      setFormError("Revisá el nombre, la especialidad y los años de experiencia.");
      return;
    }
    setIsSaving(true);
    try {
      let image = barberForm.image.trim();
      if (selectedImage) {
        const imageData = new FormData();
        imageData.append("file", selectedImage);
        const uploadResult = await (await fetch("/api/admin/uploads/barber-image", { method: "POST", body: imageData })).json();
        if (!uploadResult.success) throw new Error(uploadResult.error?.message || "No se pudo subir la imagen");
        image = uploadResult.data.url;
      }
      const response = await fetch(editingBarberId ? `/api/admin/barbers/${editingBarberId}` : "/api/admin/barbers", {
        method: editingBarberId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: barberForm.name.trim(), specialty: barberForm.specialty.trim(), experience, image, isActive: barberForm.isActive }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || result.message || "No se pudo guardar el barbero");
      closeFormModal();
      setPageMessage(editingBarberId ? "Los datos del barbero se actualizaron." : "El nuevo barbero fue agregado al equipo.");
      await fetchBarbers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar el barbero");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBarber(barber: Barber) {
    if (!window.confirm(`¿Eliminar a ${barber.name}? Esta acción no se puede deshacer.`)) return;
    setPageMessage("");
    try {
      const result = await (await fetch(`/api/admin/barbers/${barber.id}`, { method: "DELETE" })).json();
      if (!result.success) throw new Error(result.error?.message || "No se pudo eliminar el barbero");
      setPageMessage(`${barber.name} fue eliminado del equipo.`);
      await fetchBarbers();
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "No se pudo eliminar el barbero");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-white">Equipo de barberos</h1><p className="text-muted-foreground">Gestioná el equipo y revisá el rendimiento de cada barbero.</p></div><button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-black hover:bg-primary/90"><Plus size={16} /> Nuevo barbero</button></div>

      {pageMessage && <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-zinc-300">{pageMessage}</div>}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-luxury-grey">
        <div className="overflow-x-auto"><table className="w-full border-collapse text-left">
          <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-4">Barbero</th><th className="px-6 py-4">Especialidad</th><th className="px-6 py-4 text-center">Cortes hoy</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 animate-spin text-primary" />Cargando barberos...</td></tr>
            : barbers.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No hay barberos registrados.</td></tr>
            : barbers.map((barber) => <tr key={barber.id} onClick={() => openDetails(barber.id)} className={cn("group cursor-pointer transition-colors hover:bg-white/5", !barber.isActive && "opacity-55")}>
              <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-bold text-primary">{barber.name.charAt(0)}</div><span className="font-medium text-white">{barber.name}</span></div></td>
              <td className="px-6 py-4 text-muted-foreground">{barber.specialty}</td>
              <td className="px-6 py-4 text-center"><span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{barber.completedToday}</span></td>
              <td className="px-6 py-4"><span className={cn("rounded-lg border px-2.5 py-1 text-xs font-semibold", barber.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-zinc-400")}>{barber.isActive ? "Activo" : "Inactivo"}</span></td>
              <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1"><button type="button" onClick={(event) => { event.stopPropagation(); openEdit(barber); }} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white"><Edit2 size={14} /> Editar</button><button type="button" aria-label={`Eliminar a ${barber.name}`} onClick={(event) => { event.stopPropagation(); deleteBarber(barber); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={15} /></button></div></td>
            </tr>)}
          </tbody>
        </table></div>
      </div>

      {formModalOpen && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeFormModal(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="barber-form-title" className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#191919] shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Scissors size={18} /></div><div><h2 id="barber-form-title" className="text-lg font-semibold text-white">{editingBarberId ? "Editar barbero" : "Nuevo barbero"}</h2><p className="mt-0.5 text-xs text-zinc-500">Datos públicos y estado dentro del equipo.</p></div></div><button type="button" aria-label="Cerrar" onClick={closeFormModal} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white"><X size={19} /></button></header>
            <form onSubmit={saveBarber}>
              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                <Field label="Nombre"><input autoFocus required value={barberForm.name} onChange={(event) => setBarberForm({ ...barberForm, name: event.target.value })} placeholder="Nombre y apellido" className={inputClass} /></Field>
                <Field label="Especialidad"><input required value={barberForm.specialty} onChange={(event) => setBarberForm({ ...barberForm, specialty: event.target.value })} placeholder="Ej. Corte clásico y barba" className={inputClass} /></Field>
                <Field label="Años de experiencia"><input required type="number" min="0" step="1" value={barberForm.experience} onChange={(event) => setBarberForm({ ...barberForm, experience: event.target.value })} className={inputClass} /></Field>
                <Field label="Estado"><select value={barberForm.isActive ? "active" : "inactive"} onChange={(event) => setBarberForm({ ...barberForm, isActive: event.target.value === "active" })} className={inputClass}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></Field>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-medium text-zinc-400">Foto del barbero</p>
                  {imagePreview ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                      <img src={imagePreview} alt="Vista previa del barbero" className="h-24 w-20 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{selectedImage?.name || "Imagen actual"}</p><p className="mt-1 text-xs text-zinc-500">{selectedImage ? `${(selectedImage.size / 1024 / 1024).toFixed(1)} MB` : "Podés reemplazarla por otra imagen."}</p><div className="mt-3 flex flex-wrap gap-2"><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-zinc-300 hover:bg-white/5"><ImagePlus size={14} /> Cambiar foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} className="sr-only" /></label><button type="button" onClick={removeImage} className="h-9 rounded-lg px-3 text-xs font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400">Quitar</button></div></div>
                    </div>
                  ) : (
                    <label
                      onDragEnter={(event) => { event.preventDefault(); setIsDraggingImage(true); }}
                      onDragOver={(event) => { event.preventDefault(); setIsDraggingImage(true); }}
                      onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setIsDraggingImage(false); }}
                      onDrop={(event) => { event.preventDefault(); setIsDraggingImage(false); chooseImage(event.dataTransfer.files?.[0]); }}
                      className={cn("flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition-colors", isDraggingImage ? "border-primary bg-primary/[0.08]" : "border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.035]")}
                    >
                      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><UploadCloud size={19} /></span>
                      <span className="text-sm font-medium text-white">Arrastrá una foto o hacé clic para elegirla</span>
                      <span className="mt-1.5 text-xs text-zinc-500">JPG, PNG o WebP · máximo 5 MB</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} className="sr-only" />
                    </label>
                  )}
                </div>
                {formError && <div className="sm:col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{formError}</div>}
              </div>
              <footer className="flex flex-col-reverse gap-2 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeFormModal} className="h-10 rounded-lg px-4 text-sm font-medium text-zinc-300 hover:bg-white/5">Cancelar</button><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-black hover:bg-primary/90 disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {editingBarberId ? "Guardar cambios" : "Agregar barbero"}</button></footer>
            </form>
          </section>
        </div>, document.body
      )}

      {selectedBarberId && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <button type="button" aria-label="Cerrar estadísticas" onClick={closeModal} className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md" />
          <section role="dialog" aria-modal="true" aria-labelledby="barber-stats-title" className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-luxury-grey shadow-2xl sm:max-h-[calc(100vh-3rem)]">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-luxury-black">{details?.barber.name.charAt(0) || "?"}</div><div className="min-w-0"><h3 id="barber-stats-title" className="truncate text-xl font-semibold text-white">{details?.barber.name || "Cargando..."}</h3><p className="truncate text-sm text-muted-foreground">Rendimiento mensual · {details?.barber.specialty}</p></div></div>
              <button type="button" onClick={closeModal} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"><X size={20} /></button>
            </header>

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              {isLoadingDetails ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="animate-spin text-primary" size={28} /><p>Calculando estadísticas del mes...</p></div>
              : details ? <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-medium text-white">Periodo analizado</p><p className="text-xs text-muted-foreground">Solo los turnos completados cuentan como cortes.</p></div>
                  <div className="flex gap-2">
                    <select aria-label="Mes" value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)} className="h-10 min-w-32 rounded-lg border border-white/10 bg-luxury-black px-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40">{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select>
                    <select aria-label="Año" value={filterYear} onChange={(event) => setFilterYear(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-luxury-black px-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40">{Array.from({ length: 5 }, (_, index) => now.getFullYear() - index).map((year) => <option key={year} value={year}>{year}</option>)}</select>
                    <button type="button" onClick={() => fetchDetails(selectedBarberId, Number(filterMonth), Number(filterYear))} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-luxury-black transition-colors hover:bg-primary/90">Aplicar</button>
                  </div>
                </div>

                <div className="grid overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] sm:grid-cols-3 sm:divide-x sm:divide-white/10">
                  <Metric icon={<Calendar size={18} />} label="Turnos del mes" value={details.totalAppointments} />
                  <Metric icon={<CheckCircle2 size={18} className="text-emerald-400" />} label="Cortes realizados" value={details.totalCompleted} />
                  <Metric icon={<TrendingUp size={18} className="text-primary" />} label="Tasa completada" value={`${details.totalAppointments ? Math.round(details.totalCompleted / details.totalAppointments * 100) : 0}%`} />
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
                  <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BarChart3 size={18} className="text-primary" /><h4 className="font-medium text-white">Cortes por servicio</h4></div><span className="text-xs text-muted-foreground">{MONTHS[details.period.month - 1]} {details.period.year}</span></div>
                    {details.services.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center text-center"><Scissors size={22} className="mb-2 text-muted-foreground" /><p className="text-sm text-white">Sin cortes completados</p><p className="mt-1 text-xs text-muted-foreground">Prueba seleccionando otro mes.</p></div>
                    : <div className="space-y-4">{details.services.map((service) => <div key={service.serviceId}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate text-white">{service.title}</span><span className="shrink-0 font-semibold text-white">{service.count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${service.percentage}%` }} /></div><p className="mt-1 text-right text-[11px] text-muted-foreground">{service.percentage}% del total</p></div>)}</div>}
                  </section>

                  <section className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2"><Scissors size={17} className="text-primary" /><h4 className="font-medium text-white">Detalle de turnos</h4></div><span className="text-xs text-muted-foreground">{details.history.length} registros</span></div>
                    <div className="max-h-72 overflow-auto"><table className="w-full text-left"><thead className="sticky top-0 bg-[#222222] text-[11px] font-medium text-muted-foreground"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Servicio</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-white/5">
                      {details.history.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">No hay turnos en este periodo.</td></tr> : details.history.map((appointment) => <tr key={appointment.id} className="transition-colors hover:bg-white/[0.035]"><td className="whitespace-nowrap px-4 py-3 text-sm text-white">{appointment.customer.name}</td><td className="px-4 py-3 text-sm text-muted-foreground">{appointment.service.title}</td><td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{new Date(appointment.startTime).toLocaleDateString("es-AR", { timeZone: SHOP_TIME_ZONE, day: "2-digit", month: "short" })}</td><td className="px-4 py-3"><StatusBadge status={appointment.status} /></td></tr>)}
                    </tbody></table></div>
                  </section>
                </div>
              </div> : <div className="py-16 text-center text-muted-foreground">No se encontraron detalles.</div>}
            </div>
          </section>
        </div>, document.body
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <div className="flex items-center gap-3 border-b border-white/10 p-4 last:border-b-0 sm:border-b-0"><span className="text-muted-foreground">{icon}</span><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold text-white">{value}</p></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="block text-xs font-medium text-zinc-400">{label}</span>{children}</label>;
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const labels = { COMPLETED: "Completado", SCHEDULED: "Programado", CANCELLED: "Cancelado", NO_SHOW: "Ausente" };
  return <span className={cn("whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold", status === "COMPLETED" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400", status === "SCHEDULED" && "border-amber-500/20 bg-amber-500/10 text-amber-400", status === "CANCELLED" && "border-red-500/20 bg-red-500/10 text-red-400", status === "NO_SHOW" && "border-white/10 bg-white/5 text-muted-foreground")}>{labels[status]}</span>;
}
