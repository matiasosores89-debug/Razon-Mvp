"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, CalendarRange, Users, Scissors, ShieldCheck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/admin/LogoutButton";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Turnos", href: "/admin/appointments", icon: CalendarDays },
  { label: "Barberos", href: "/admin/barbers", icon: Scissors },
  { label: "Servicios", href: "/admin/services", icon: Scissors },
  { label: "Disponibilidad", href: "/admin/availability", icon: CalendarRange },
  { label: "Clientes", href: "/admin/customers", icon: Users },
  { label: "Seguridad", href: "/admin/security", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  if (["/admin/login", "/admin/forgot-password", "/admin/reset-password"].includes(pathname)) return <>{children}</>;

  const currentLabel = navItems.find((item) => item.href === pathname)?.label || "Administración";

  return (
    <div className="min-h-[100dvh] bg-luxury-black md:flex">
      {mobileNavOpen && <button type="button" aria-label="Cerrar navegación" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" />}

      <aside id="admin-navigation" className={cn("fixed inset-y-0 left-0 z-50 flex w-[min(19rem,86vw)] flex-col border-r border-white/10 bg-luxury-grey transition-transform duration-200 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0", mobileNavOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tighter text-primary">RAZOR <span className="font-light text-white">ADMIN</span></h1>
            <button type="button" onClick={() => setMobileNavOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white md:hidden" aria-label="Cerrar menú"><X size={22}/></button>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return <Link key={item.href} href={item.href} className={cn("group flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 transition-colors", isActive ? "bg-primary font-semibold text-luxury-black" : "text-muted-foreground hover:bg-white/5 hover:text-white")}><item.icon size={20} className={cn("shrink-0", isActive ? "text-luxury-black" : "text-muted-foreground group-hover:text-primary")}/>{item.label}</Link>;
          })}
        </nav>

        <div className="border-t border-white/10 p-4"><LogoutButton /></div>
      </aside>

      <main className="min-w-0 flex-1 md:overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-luxury-grey/95 px-4 backdrop-blur-md sm:px-6 md:static md:bg-luxury-grey/50 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileNavOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white hover:bg-white/5 md:hidden" aria-expanded={mobileNavOpen} aria-controls="admin-navigation" aria-label="Abrir menú"><Menu size={21}/></button>
            <h2 className="truncate font-medium text-white">{currentLabel}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block"><p className="text-sm font-medium text-white">Admin User</p><p className="text-xs text-muted-foreground">Super Administrador</p></div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-luxury-black sm:h-10 sm:w-10">A</div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6 sm:py-7 md:p-8">{children}</div>
      </main>
    </div>
  );
}
