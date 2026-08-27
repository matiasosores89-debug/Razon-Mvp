"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  async function logout() {
    setIsLoading(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { router.replace("/admin/login"); router.refresh(); }
  }
  return (
    <button type="button" onClick={logout} disabled={isLoading} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60">
      <LogOut aria-hidden="true" size={20} />
      {isLoading ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
