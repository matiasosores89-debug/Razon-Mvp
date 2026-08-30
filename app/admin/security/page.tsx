"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, History, KeyRound, ShieldCheck } from "lucide-react";

type AuditLog = { id: string; actor: string; action: string; entityType: string; summary: string; createdAt: string };

const actionNames: Record<string, string> = { CREATE: "Creación", UPDATE: "Edición", DELETE: "Eliminación", STATUS_CHANGE: "Cambio de estado", LOGIN: "Inicio de sesión", LOGIN_FAILED: "Acceso fallido", PASSWORD_CHANGE: "Cambio de contraseña", PASSWORD_RESET: "Recuperación de contraseña" };

export default function SecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string }>();

  useEffect(() => { fetch("/api/admin/audit").then((response) => response.json()).then((result) => setLogs(result.data || [])).finally(() => setLoadingLogs(false)); }, []);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(undefined);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("newPassword") !== form.get("confirmPassword")) return setNotice({ ok: false, text: "Las contraseñas nuevas no coinciden." });
    setSaving(true);
    try {
      const response = await fetch("/api/admin/security/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }) });
      const result = await response.json();
      setNotice({ ok: response.ok, text: result.message });
      if (response.ok) formElement.reset();
    } finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-6xl space-y-8 text-white">
    <header><div className="flex items-center gap-3"><ShieldCheck className="text-primary"/><h1 className="text-3xl font-semibold tracking-tight">Seguridad</h1></div><p className="mt-2 text-sm text-zinc-400">Protegé el acceso y revisá los cambios realizados en el sistema.</p></header>
    <div className="grid items-start gap-6 xl:grid-cols-[390px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-luxury-grey p-6"><div className="flex items-center gap-3"><KeyRound className="text-primary" size={20}/><h2 className="text-lg font-semibold">Cambiar contraseña</h2></div><p className="mt-2 text-sm leading-6 text-zinc-400">El cambio se aplica de inmediato. Tus sesiones actuales vencen en su horario habitual.</p>
        <form onSubmit={changePassword} className="mt-6 space-y-4">{[["currentPassword","Contraseña actual"],["newPassword","Nueva contraseña"],["confirmPassword","Repetir contraseña"]].map(([name,label]) => <div key={name} className="space-y-2"><label htmlFor={name} className="text-sm font-medium text-zinc-200">{label}</label><input id={name} name={name} type="password" required autoComplete={name === "currentPassword" ? "current-password" : "new-password"} className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"/></div>)}
          <p className="text-xs leading-5 text-zinc-500">Mínimo 12 caracteres, con mayúscula, minúscula y número.</p>{notice && <p role="status" className={`rounded-xl border p-3 text-sm ${notice.ok ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>{notice.text}</p>}<button disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-luxury-black disabled:opacity-50">{notice?.ok && <CheckCircle2 size={17}/>} {saving ? "Guardando..." : "Actualizar contraseña"}</button>
        </form>
      </section>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-luxury-grey"><div className="border-b border-white/10 px-6 py-5"><div className="flex items-center gap-3"><History className="text-primary" size={20}/><h2 className="text-lg font-semibold">Actividad administrativa</h2></div><p className="mt-2 text-sm text-zinc-400">Últimas acciones sensibles realizadas en el panel.</p></div>
        <div className="divide-y divide-white/[.07]">{loadingLogs ? <p className="p-6 text-sm text-zinc-400">Cargando actividad...</p> : logs.length === 0 ? <p className="p-6 text-sm text-zinc-400">Todavía no hay acciones registradas.</p> : logs.map((log) => <article key={log.id} className="flex gap-4 px-6 py-4"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-zinc-100">{log.summary}</p><time className="text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString("es-AR")}</time></div><p className="mt-1 text-xs text-zinc-500">{log.actor} · {actionNames[log.action] || log.action} · {log.entityType}</p></div></article>)}</div>
      </section>
    </div>
  </div>;
}
