"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Calendar, DollarSign, CheckCircle, Clock } from "lucide-react";

interface Stats {
  summary: {
    totalAppointments: number;
    todayAppointments: number;
    totalRevenue: number;
    completionRate: number;
  };
  activity: { date: string; count: number }[];
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
  <div className="bg-luxury-grey border border-white/10 p-6 rounded-2xl">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const result = await res.json();
        if (result.success) setStats(result.data);
      } catch (e) {
        console.error("Error fetching stats", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-white text-center">No se pudieron cargar las estadísticas.</div>;
  }

  const maxCount = Math.max(...stats.activity.map(a => a.count), 1);
  const scaleMax = Math.ceil(maxCount / 5) * 5;
  const scaleSteps = Array.from({ length: Math.floor(scaleMax / 5) + 1 }, (_, i) => i * 5);

  // Fill in the last 30 days to ensure we have a full chart with variance
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const fullActivity = last30Days.map(date => {
    const dayData = stats.activity.find(a => a.date === date);
    return {
      date,
      count: dayData ? dayData.count : 0
    };
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Turnos"
          value={stats.summary.totalAppointments}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          title="Hoy"
          value={stats.summary.todayAppointments}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Ingresos Totales"
          value={`$${stats.summary.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Tasa de Éxito"
          value={`${stats.summary.completionRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="bg-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-luxury-grey border border-white/10 p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Actividad de Turnos</h3>
              <p className="text-muted-foreground text-sm">Últimos 30 días</p>
            </div>
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <TrendingUp size={16} />
              Tendencia Positiva
            </div>
          </div>

          <div className="flex gap-4 h-64 relative">
            {/* Y-Axis Scale - Fixed to grow Bottom-Up */}
            <div className="flex flex-col-reverse justify-between text-[10px] text-muted-foreground py-2 w-8">
              {scaleSteps.map((step) => (
                <span key={step} className="leading-none flex items-center justify-end pr-2">
                  {step}
                </span>
              ))}
            </div>

            <div className="flex-1 flex items-end gap-2 relative px-2 border-l border-white/10">
              {/* Grid lines aligned with scale steps - Fixed to grow Bottom-Up */}
              <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none">
                {scaleSteps.map((_, i) => (
                  <div key={i} className="w-full border-t border-white/5" />
                ))}
              </div>

              {fullActivity.map((day, i) => (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative z-10">
                  <div
                    className="w-full bg-gradient-to-t from-primary/60 to-primary group-hover:from-primary group-hover:to-primary transition-all duration-300 rounded-t-sm relative min-h-[4px] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    style={{ height: `${(day.count / scaleMax) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-luxury-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.count} turnos
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground rotate-45 absolute -bottom-6 whitespace-nowrap">
                    {day.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-luxury-grey border border-white/10 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-6">Resumen Rápido</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
              <span className="text-muted-foreground text-sm">Estado del Negocio</span>
              <span className="text-primary text-sm font-bold">Activo</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
              <span className="text-muted-foreground text-sm">Barberos Activos</span>
              <span className="text-white text-sm font-bold">4</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
              <span className="text-muted-foreground text-sm">Servicios Ofrecidos</span>
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div className="mt-8">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center">
                <p className="text-primary text-sm font-medium mb-2">Tip de Gestión</p>
                <p className="text-white text-xs">Los martes son tus días más flojos. Considera una promo de &quot;Martes de Barba&quot;.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
