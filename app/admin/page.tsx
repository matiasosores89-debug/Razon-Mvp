"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, DollarSign, Scissors, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getShopDateString } from "@/lib/datetime";

interface Stats {
  summary: { totalAppointments: number; todayAppointments: number; totalRevenue: number; completedThisMonth: number; completionRate: number; activeBarbers: number; offeredServices: number };
  activity: { date: string; count: number }[];
}

type StatCardProps = {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
};

const StatCard = ({ title, value, detail, icon: Icon }: StatCardProps) => (
  <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-luxury-grey p-5 transition-colors duration-200 hover:border-primary/25">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white tabular-nums">{value}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.08] text-primary">
        <Icon size={18} />
      </div>
    </div>
    <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">{detail}</p>
  </article>
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-7" aria-label="Cargando estadísticas">
    <div className="space-y-3"><div className="h-8 w-56 rounded-lg bg-white/[0.07]" /><div className="h-4 w-80 max-w-full rounded bg-white/[0.05]" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-2xl bg-white/[0.05]" />)}</div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(17rem,0.8fr)]"><div className="h-96 rounded-3xl bg-white/[0.05]" /><div className="h-96 rounded-3xl bg-white/[0.05]" /></div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const result = await res.json();
        if (result.success) setStats(result.data);
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (!stats) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-luxury-grey px-6 text-center">
        <CalendarDays className="mb-4 text-zinc-600" size={30} />
        <h2 className="text-lg font-semibold text-white">No pudimos cargar el dashboard</h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">Actualizá la página para volver a consultar las estadísticas.</p>
      </div>
    );
  }

  const last30Days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return getShopDateString(date);
  });
  const fullActivity = last30Days.map((date) => ({ date, count: stats.activity.find((item) => item.date === date)?.count ?? 0 }));
  const maxCount = Math.max(...fullActivity.map((item) => item.count), 1);
  const recentWeek = fullActivity.slice(-7).reduce((total, day) => total + day.count, 0);
  const previousWeek = fullActivity.slice(-14, -7).reduce((total, day) => total + day.count, 0);
  const trend = previousWeek === 0 ? (recentWeek > 0 ? 100 : 0) : ((recentWeek - previousWeek) / previousWeek) * 100;
  const trendUp = trend >= 0;
  const busiestDay = fullActivity.reduce((best, day) => day.count > best.count ? day : best, fullActivity[0]);
  const hasActivity = fullActivity.some((day) => day.count > 0);
  const formattedToday = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resumen del negocio</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-500 first-letter:uppercase">{formattedToday} · Datos actualizados</p>
        </div>
        <Link href="/admin/appointments" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 text-sm font-semibold text-luxury-black transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:self-auto">
          Ver turnos <ArrowRight size={16} />
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas principales">
        <StatCard title="Turnos totales" value={stats.summary.totalAppointments} detail="Histórico de reservas" icon={CalendarDays} />
        <StatCard title="Turnos de hoy" value={stats.summary.todayAppointments} detail="Agenda del día" icon={Clock3} />
        <StatCard
          title="Ingresos acumulados"
          value={`$${stats.summary.totalRevenue.toLocaleString("es-AR")}`}
          detail={`${stats.summary.completedThisMonth} ${stats.summary.completedThisMonth === 1 ? "turno completado" : "turnos completados"} este mes`}
          icon={DollarSign}
        />
        <StatCard title="Tasa de finalización" value={`${stats.summary.completionRate.toFixed(1)}%`} detail="Sobre el total registrado" icon={CheckCircle2} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(17rem,0.8fr)]">
        <section className="rounded-3xl border border-white/[0.08] bg-luxury-grey p-5 sm:p-7">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-lg font-semibold tracking-tight text-white">Actividad de turnos</h2><p className="mt-1 text-sm text-zinc-500">Volumen diario durante los últimos 30 días</p></div>
            <div className="flex items-center gap-2 self-start rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
              {trendUp ? <ArrowUpRight size={16} className="text-primary" /> : <ArrowDownRight size={16} className="text-zinc-400" />}
              <div><p className="text-xs font-semibold text-white tabular-nums">{Math.abs(trend).toFixed(0)}% {trendUp ? "más" : "menos"}</p><p className="text-[10px] text-zinc-500">vs. semana anterior</p></div>
            </div>
          </div>

          <div className="mt-6 flex h-64 items-end gap-1.5 sm:gap-2" aria-label="Gráfico de actividad de los últimos 30 días">
            {fullActivity.map((day, index) => {
              const height = Math.max((day.count / maxCount) * 100, 2);
              const showLabel = index === 0 || index === 7 || index === 14 || index === 21 || index === 29;
              return (
                <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end">
                  <div className="relative w-full rounded-t-sm bg-primary/30 transition-colors duration-200 group-hover:bg-primary" style={{ height: `${height}%` }}>
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#111] px-2.5 py-1.5 text-[11px] shadow-xl group-hover:block">
                      <span className="font-semibold text-white">{day.count} turnos</span>
                      <span className="mx-1.5 text-zinc-700">·</span>
                      <span className="text-zinc-400">{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</span>
                    </div>
                  </div>
                  {showLabel && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-zinc-600">{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-zinc-500"><span>{recentWeek} turnos esta semana</span><span>Pico diario: {maxCount}</span></div>
        </section>

        <aside className="overflow-hidden rounded-3xl border border-white/[0.08] bg-luxury-grey">
          <div className="border-b border-white/[0.06] px-6 py-5"><h2 className="text-lg font-semibold tracking-tight text-white">Estado operativo</h2><p className="mt-1 text-sm text-zinc-500">Capacidad y actividad actual</p></div>
          <div className="divide-y divide-white/[0.06] px-6">
            <div className="flex items-center justify-between py-4"><div className="flex items-center gap-3 text-sm text-zinc-400"><Users size={16} /> Barberos activos</div><span className="font-semibold text-white tabular-nums">{stats.summary.activeBarbers}</span></div>
            <div className="flex items-center justify-between py-4"><div className="flex items-center gap-3 text-sm text-zinc-400"><Scissors size={16} /> Servicios disponibles</div><span className="font-semibold text-white tabular-nums">{stats.summary.offeredServices}</span></div>
            <div className="flex items-center justify-between py-4"><div className="flex items-center gap-3 text-sm text-zinc-400"><CalendarDays size={16} /> Estado de agenda</div><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Activa</span></div>
          </div>
          <div className="m-4 rounded-2xl border border-primary/15 bg-primary/[0.06] p-4">
            <p className="text-xs font-semibold text-primary">Lectura rápida</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{hasActivity ? `El mayor movimiento del último mes fue el ${busiestDay.date.slice(8, 10)}/${busiestDay.date.slice(5, 7)}, con ${busiestDay.count} turnos.` : "Todavía no hay actividad registrada en los últimos 30 días."}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
