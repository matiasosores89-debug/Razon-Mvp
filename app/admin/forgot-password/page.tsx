"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Turnstile } from "@/components/security/Turnstile";

export default function ForgotPasswordPage() {
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devUrl, setDevUrl] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), turnstileToken: token }) });
      const result = await response.json();
      setMessage(result.message);
      setDevUrl(result.developmentResetUrl || "");
    } finally {
      setLoading(false);
      setToken("");
      setResetKey((value) => value + 1);
    }
  }

  return <main className="flex min-h-[100dvh] items-center justify-center bg-luxury-black px-5 py-10 text-white">
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-luxury-grey p-7 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-9">
      <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><ShieldCheck size={21} /></div>
      <h1 className="text-2xl font-semibold tracking-tight">Recuperar acceso</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Te enviaremos un enlace válido durante 30 minutos.</p>
      {message ? <div role="status" className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">{message}{devUrl && <Link className="mt-3 block font-semibold text-primary underline" href={devUrl}>Abrir enlace de desarrollo</Link>}</div> :
      <form onSubmit={submit} className="mt-7 space-y-5">
        <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium text-zinc-200">Correo del administrador</label><div className="relative"><Mail className="absolute left-4 top-3.5 text-zinc-500" size={18}/><input id="email" name="email" type="email" required autoFocus autoComplete="email" className="h-12 w-full rounded-xl border border-white/15 bg-black/20 pl-11 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div></div>
        <Turnstile action="forgot_password" onVerify={setToken} resetKey={resetKey}/>
        <button disabled={loading || !token} className="h-12 w-full rounded-xl bg-primary font-semibold text-luxury-black disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Enviando..." : "Enviar enlace seguro"}</button>
      </form>}
      <Link href="/admin/login" className="mt-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"><ArrowLeft size={16}/> Volver al inicio de sesión</Link>
    </section>
  </main>;
}
