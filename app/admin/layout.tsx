"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/admin/LogoutButton";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Turnos", href: "/admin/appointments", icon: CalendarDays },
  { label: "Barberos", href: "/admin/barbers", icon: Scissors },
  { label: "Clientes", href: "/admin/customers", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-luxury-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-luxury-grey border-r border-white/10 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary tracking-tighter">
            RAZOR <span className="text-white font-light">ADMIN</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-luxury-black font-semibold"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-luxury-black" : "text-muted-foreground group-hover:text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-luxury-grey/50 border-b border-white/10 flex items-center justify-between px-8">
          <h2 className="text-white font-medium">
            {navItems.find(item => item.href === pathname)?.label || "Administración"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-muted-foreground">Super Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-luxury-black font-bold">
              A
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
