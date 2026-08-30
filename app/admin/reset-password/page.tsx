"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) return setMessage("Las contraseñas no coinciden.");
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: form.get("password") }) });
      const result = await response.json();
      setMessage(result.message); setSuccess(response.ok);
    } finally { setLoading(false); }
  }
  return <section className="w-full max-w-md rounded-2xl border border-white/10 bg-luxury-grey p-7 sm:p-9">
    <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><KeyRound size={21}/></div>
    <h1 className="text-2xl font-semibold">Crear nueva contraseña</h1><p className="mt-2 text-sm leading-6 text-zinc-400">Usá al menos 12 caracteres, una mayúscula, una minúscula y un número.</p>
    {success ? <div className="mt-6"><p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</p><Link href="/admin/login" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-primary font-semibold text-luxury-black">Iniciar sesión</Link></div> :
    <form onSubmit={submit} className="mt-7 space-y-4"><input name="password" type="password" required autoFocus autoComplete="new-password" placeholder="Nueva contraseña" className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 outline-none focus:border-primary"/><input name="confirmPassword" type="password" required autoComplete="new-password" placeholder="Repetir contraseña" className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 outline-none focus:border-primary"/>{message && <p role="alert" className="text-sm text-red-300">{message}</p>}<button disabled={loading || !token} className="h-12 w-full rounded-xl bg-primary font-semibold text-luxury-black disabled:opacity-50">{loading ? "Actualizando..." : "Guardar contraseña"}</button></form>}
  </section>;
}

export default function ResetPasswordPage() { return <main className="flex min-h-[100dvh] items-center justify-center bg-luxury-black px-5 py-10 text-white"><Suspense><ResetForm/></Suspense></main>; }
