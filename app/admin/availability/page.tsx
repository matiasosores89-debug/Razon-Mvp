"use client";

import React, { useEffect, useState } from "react";
import { CalendarOff, Check, Clock3, Loader2, Plus, Save, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type DayRule = { dayOfWeek: number; isOpen: boolean; startTime: string; endTime: string };
type BarberDay = { dayOfWeek: number; isWorking: boolean; startTime: string; endTime: string };
type Break = { id?: string; dayOfWeek: number; startTime: string; endTime: string; label?: string | null };
type BlockType = "HOLIDAY" | "VACATION" | "ABSENCE" | "OTHER";
type Block = { id?: string; barberId: string | null; type: BlockType; label: string; startDate: string; endDate: string; allDay: boolean; startTime: string | null; endTime: string | null };
type BarberConfig = { id: string; name: string; specialty: string; availability: BarberDay[]; breaks: Break[]; serviceIds: string[] };
type Service = { id: string; title: string; duration: number; price: string };
type Config = { bufferMinutes: number; businessHours: DayRule[]; barbers: BarberConfig[]; services: Service[]; blocks: Block[] };
type Tab = "shop" | "barbers" | "blocks";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const BLOCK_LABELS: Record<BlockType, string> = { HOLIDAY: "Feriado", VACATION: "Vacaciones", ABSENCE: "Ausencia", OTHER: "Otro" };
const inputClass = "h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-35";

export default function AvailabilityPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [tab, setTab] = useState<Tab>("shop");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [draftBlock, setDraftBlock] = useState<Block>({ barberId: null, type: "HOLIDAY", label: "", startDate: today, endDate: today, allDay: true, startTime: null, endTime: null });

  useEffect(() => {
    fetch("/api/admin/availability", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || "No se pudo cargar la configuración");
        setConfig(result.data);
        setSavedSnapshot(JSON.stringify(result.data));
        setSelectedBarberId(result.data.barbers[0]?.id ?? "");
      })
      .catch((error) => setMessage({ type: "error", text: error.message }))
      .finally(() => setIsLoading(false));
  }, []);

  const hasUnsavedChanges = config !== null && savedSnapshot !== "" && JSON.stringify(config) !== savedSnapshot;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  const selectedBarber = config?.barbers.find((barber) => barber.id === selectedBarberId);

  function updateBusinessDay(dayOfWeek: number, changes: Partial<DayRule>) {
    setConfig((current) => current && ({ ...current, businessHours: current.businessHours.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day) }));
  }

  function updateBarber(changes: Partial<BarberConfig>) {
    setConfig((current) => current && ({ ...current, barbers: current.barbers.map((barber) => barber.id === selectedBarberId ? { ...barber, ...changes } : barber) }));
  }

  function toggleCustomSchedule(enabled: boolean) {
    if (!selectedBarber || !config) return;
    updateBarber({ availability: enabled ? config.businessHours.map((day) => ({ dayOfWeek: day.dayOfWeek, isWorking: day.isOpen, startTime: day.startTime, endTime: day.endTime })) : [] });
  }

  function updateBarberDay(dayOfWeek: number, changes: Partial<BarberDay>) {
    if (!selectedBarber) return;
    updateBarber({ availability: selectedBarber.availability.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day) });
  }

  function addBreak() {
    if (!selectedBarber) return;
    updateBarber({ breaks: [...selectedBarber.breaks, { dayOfWeek: 1, startTime: "13:00", endTime: "14:00", label: "Almuerzo" }] });
  }

  function updateBreak(index: number, changes: Partial<Break>) {
    if (!selectedBarber) return;
    updateBarber({ breaks: selectedBarber.breaks.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) });
  }

  function toggleService(serviceId: string) {
    if (!selectedBarber) return;
    updateBarber({ serviceIds: selectedBarber.serviceIds.includes(serviceId) ? selectedBarber.serviceIds.filter((id) => id !== serviceId) : [...selectedBarber.serviceIds, serviceId] });
  }

  function addBlock() {
    if (!config || !draftBlock.label.trim()) {
      setMessage({ type: "error", text: "Ingresá un nombre para el bloqueo." });
      return;
    }
    setConfig({ ...config, blocks: [...config.blocks, { ...draftBlock, label: draftBlock.label.trim() }] });
    setDraftBlock({ barberId: null, type: "HOLIDAY", label: "", startDate: today, endDate: today, allDay: true, startTime: null, endTime: null });
    setMessage(null);
  }

  async function saveConfig() {
    if (!config) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = {
        bufferMinutes: config.bufferMinutes,
        businessHours: config.businessHours,
        barbers: config.barbers.map((barber) => ({ barberId: barber.id, availability: barber.availability, breaks: barber.breaks.map(({ id: _id, ...item }) => item), serviceIds: barber.serviceIds })),
        blocks: config.blocks,
      };
      const response = await fetch("/api/admin/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || result.message || "No se pudo guardar");
      setConfig(result.data);
      setSavedSnapshot(JSON.stringify(result.data));
      setMessage({ type: "success", text: "La disponibilidad quedó actualizada." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="flex min-h-80 items-center justify-center gap-3 text-zinc-500"><Loader2 className="animate-spin text-primary" /> Cargando disponibilidad...</div>;
  if (!config) return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">{message?.text || "No se pudo cargar la configuración."}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Agenda</p><h1 className="text-3xl font-semibold tracking-tight text-white">Disponibilidad</h1><p className="mt-2 max-w-2xl text-sm text-zinc-500">Definí cuándo se puede reservar y qué ofrece cada integrante del equipo.</p></div>
        <button type="button" onClick={saveConfig} disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-black transition-colors hover:bg-primary/90 disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios</button>
      </header>

      {message && <div role="status" className={cn("rounded-xl border px-4 py-3 text-sm", message.type === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-red-500/20 bg-red-500/5 text-red-300")}>{message.text}</div>}

      <nav className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025] p-1">
        {([{ id: "shop", label: "Horario general", icon: Clock3 }, { id: "barbers", label: "Por barbero", icon: Users }, { id: "blocks", label: "Feriados y ausencias", icon: CalendarOff }] as const).map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn("flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors", tab === item.id ? "bg-primary text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white")}><item.icon size={16} />{item.label}</button>)}
      </nav>

      {tab === "shop" && <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel title="Horario semanal" description="Este horario se aplica a todos los barberos que no tengan uno personalizado.">
          <div className="divide-y divide-white/[0.06]">{config.businessHours.map((day) => <DayRow key={day.dayOfWeek} label={DAYS[day.dayOfWeek]} enabled={day.isOpen} startTime={day.startTime} endTime={day.endTime} onToggle={(isOpen) => updateBusinessDay(day.dayOfWeek, { isOpen })} onStart={(startTime) => updateBusinessDay(day.dayOfWeek, { startTime })} onEnd={(endTime) => updateBusinessDay(day.dayOfWeek, { endTime })} />)}</div>
        </Panel>
        <Panel title="Entre turnos" description="Tiempo que se bloquea después de cada servicio.">
          <label className="text-xs font-medium text-zinc-400" htmlFor="buffer">Minutos de descanso</label>
          <select id="buffer" value={config.bufferMinutes} onChange={(event) => setConfig({ ...config, bufferMinutes: Number(event.target.value) })} className={cn(inputClass, "mt-2 w-full")}>
            {[0, 5, 10, 15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? "Sin descanso" : `${minutes} minutos`}</option>)}
          </select>
          <p className="mt-4 rounded-xl bg-primary/[0.06] p-3 text-xs leading-5 text-zinc-400">Se aplica automáticamente al calcular nuevos horarios, sin modificar la duración visible del servicio.</p>
        </Panel>
      </section>}

      {tab === "barbers" && selectedBarber && <div className="space-y-5">
        <Panel title="Barbero" description="Elegí una persona para editar sus reglas.">
          <select value={selectedBarberId} onChange={(event) => setSelectedBarberId(event.target.value)} className={cn(inputClass, "w-full max-w-sm")}>
            {config.barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name} · {barber.specialty}</option>)}
          </select>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Horario propio" description="Si está desactivado, usa el horario general del comercio.">
            <Toggle label="Personalizar horario" checked={selectedBarber.availability.length > 0} onChange={toggleCustomSchedule} />
            {selectedBarber.availability.length > 0 && <div className="mt-4 divide-y divide-white/[0.06]">{selectedBarber.availability.map((day) => <DayRow key={day.dayOfWeek} label={DAYS[day.dayOfWeek]} enabled={day.isWorking} startTime={day.startTime} endTime={day.endTime} onToggle={(isWorking) => updateBarberDay(day.dayOfWeek, { isWorking })} onStart={(startTime) => updateBarberDay(day.dayOfWeek, { startTime })} onEnd={(endTime) => updateBarberDay(day.dayOfWeek, { endTime })} />)}</div>}
          </Panel>

          <Panel title="Servicios habilitados" description="Solo estos servicios aparecerán al reservar con este barbero.">
            <div className="grid gap-2 sm:grid-cols-2">{config.services.map((service) => { const checked = selectedBarber.serviceIds.includes(service.id); return <button key={service.id} type="button" onClick={() => toggleService(service.id)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", checked ? "border-primary/25 bg-primary/[0.07] text-white" : "border-white/[0.07] text-zinc-500 hover:border-white/15")}><span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", checked ? "border-primary bg-primary text-black" : "border-white/15")}>{checked && <Check size={13} />}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{service.title}</span><span className="text-[11px] text-zinc-500">{service.duration} min</span></span></button>; })}</div>
          </Panel>
        </div>

        <Panel title="Descansos recurrentes" description="Pausas semanales como almuerzo, limpieza o cambio de turno.">
          <div className="space-y-2">{selectedBarber.breaks.map((item, index) => <div key={item.id ?? index} className="grid gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 sm:grid-cols-[9rem_1fr_8rem_8rem_2.5rem] sm:items-center">
            <select value={item.dayOfWeek} onChange={(event) => updateBreak(index, { dayOfWeek: Number(event.target.value) })} className={inputClass}>{DAYS.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}</select>
            <input aria-label="Nombre del descanso" value={item.label ?? ""} onChange={(event) => updateBreak(index, { label: event.target.value })} placeholder="Ej. Almuerzo" className={inputClass} />
            <input aria-label="Inicio del descanso" type="time" value={item.startTime} onChange={(event) => updateBreak(index, { startTime: event.target.value })} className={inputClass} />
            <input aria-label="Fin del descanso" type="time" value={item.endTime} onChange={(event) => updateBreak(index, { endTime: event.target.value })} className={inputClass} />
            <button type="button" aria-label="Eliminar descanso" onClick={() => updateBarber({ breaks: selectedBarber.breaks.filter((_, itemIndex) => itemIndex !== index) })} className="flex h-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16} /></button>
          </div>)}</div>
          <button type="button" onClick={addBreak} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-zinc-300 hover:bg-white/5"><Plus size={15} /> Agregar descanso</button>
        </Panel>
      </div>}

      {tab === "blocks" && <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.25fr)]">
        <Panel title="Nuevo bloqueo" description="Cerrá toda la agenda o bloqueá únicamente a un barbero.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Motivo"><input value={draftBlock.label} onChange={(event) => setDraftBlock({ ...draftBlock, label: event.target.value })} placeholder="Ej. Feriado nacional" className={cn(inputClass, "w-full")} /></Field>
            <Field label="Tipo"><select value={draftBlock.type} onChange={(event) => setDraftBlock({ ...draftBlock, type: event.target.value as BlockType })} className={cn(inputClass, "w-full")}>{Object.entries(BLOCK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="A quién afecta"><select value={draftBlock.barberId ?? ""} onChange={(event) => setDraftBlock({ ...draftBlock, barberId: event.target.value || null })} className={cn(inputClass, "w-full")}><option value="">Todo el comercio</option>{config.barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></Field>
            <div className="flex items-end pb-1"><Toggle label="Día completo" checked={draftBlock.allDay} onChange={(allDay) => setDraftBlock({ ...draftBlock, allDay, startTime: allDay ? null : "09:00", endTime: allDay ? null : "13:00" })} /></div>
            <Field label="Desde"><input type="date" value={draftBlock.startDate} onChange={(event) => setDraftBlock({ ...draftBlock, startDate: event.target.value, endDate: event.target.value > draftBlock.endDate ? event.target.value : draftBlock.endDate })} className={cn(inputClass, "w-full")} /></Field>
            <Field label="Hasta"><input type="date" min={draftBlock.startDate} value={draftBlock.endDate} onChange={(event) => setDraftBlock({ ...draftBlock, endDate: event.target.value })} className={cn(inputClass, "w-full")} /></Field>
            {!draftBlock.allDay && <><Field label="Hora de inicio"><input type="time" value={draftBlock.startTime ?? ""} onChange={(event) => setDraftBlock({ ...draftBlock, startTime: event.target.value })} className={cn(inputClass, "w-full")} /></Field><Field label="Hora de fin"><input type="time" value={draftBlock.endTime ?? ""} onChange={(event) => setDraftBlock({ ...draftBlock, endTime: event.target.value })} className={cn(inputClass, "w-full")} /></Field></>}
          </div>
          <button type="button" onClick={addBlock} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-black hover:bg-primary/90"><Plus size={16} /> Agregar bloqueo</button>
        </Panel>

        <Panel title="Bloqueos cargados" description={`${config.blocks.length} ${config.blocks.length === 1 ? "periodo configurado" : "periodos configurados"}`}>
          {config.blocks.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center"><CalendarOff size={24} className="mb-3 text-zinc-600" /><p className="text-sm text-zinc-400">No hay feriados ni ausencias cargadas.</p></div> : <div className="space-y-2">{config.blocks.map((block, index) => {
            const barberName = block.barberId ? config.barbers.find((barber) => barber.id === block.barberId)?.name : "Todo el comercio";
            return <div key={block.id ?? index} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><CalendarOff size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{block.label}</p><span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">{BLOCK_LABELS[block.type]}</span></div><p className="mt-1 text-xs text-zinc-500">{block.startDate === block.endDate ? block.startDate : `${block.startDate} al ${block.endDate}`} · {barberName}{!block.allDay && ` · ${block.startTime}–${block.endTime}`}</p></div><button type="button" aria-label="Eliminar bloqueo" onClick={() => setConfig({ ...config, blocks: config.blocks.filter((_, itemIndex) => itemIndex !== index) })} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={16} /></button></div>;
          })}</div>}
        </Panel>
      </div>}

      {hasUnsavedChanges && <div className="sticky bottom-4 z-40 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-[#202018]/95 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="h-2 w-2 shrink-0 rounded-full bg-primary" /><div><p className="text-sm font-semibold text-white">Hay cambios sin guardar</p><p className="text-xs text-zinc-400">Guardalos para que se apliquen al calendario de reservas.</p></div></div>
        <button type="button" onClick={saveConfig} disabled={isSaving} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-black transition-colors hover:bg-primary/90 disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar y aplicar</button>
      </div>}
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-luxury-grey"><header className="border-b border-white/[0.06] px-5 py-4"><h2 className="font-semibold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p></header><div className="p-5">{children}</div></section>;
}

function DayRow({ label, enabled, startTime, endTime, onToggle, onStart, onEnd }: { label: string; enabled: boolean; startTime: string; endTime: string; onToggle: (value: boolean) => void; onStart: (value: string) => void; onEnd: (value: string) => void }) {
  return <div className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[7rem_1fr_8rem_1rem_8rem] sm:items-center"><Toggle label={label} checked={enabled} onChange={onToggle} /><span className={cn("hidden text-xs sm:block", enabled ? "text-zinc-500" : "text-zinc-600")}>{enabled ? "Abierto" : "Cerrado"}</span><input aria-label={`Apertura ${label}`} type="time" value={startTime} disabled={!enabled} onChange={(event) => onStart(event.target.value)} className={inputClass} /><span className="hidden text-center text-zinc-600 sm:block">–</span><input aria-label={`Cierre ${label}`} type="time" value={endTime} disabled={!enabled} onChange={(event) => onEnd(event.target.value)} className={inputClass} /></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><span className="relative h-5 w-9 rounded-full bg-white/10 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-zinc-300 after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-black" />{label}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="block text-xs font-medium text-zinc-400">{label}</span>{children}</label>;
}
