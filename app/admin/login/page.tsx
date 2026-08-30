"use client";

import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || result.error?.message || "No se pudo iniciar sesión.");
        return;
      }
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-luxury-black px-5 py-8 text-white sm:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden max-w-xl lg:block">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" size={24} strokeWidth={1.8} />
          </div>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight">Tu negocio, bajo control.</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">Acceso privado para gestionar turnos, clientes y equipo desde un solo lugar.</p>
        </section>

        <section className="w-full rounded-2xl border border-white/10 bg-luxury-grey p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-9">
          <div className="mb-8">
            <p className="text-sm font-medium text-primary">RAZOR ADMIN</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Iniciar sesión</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">Ingresa tus credenciales para continuar.</p>
          </div>

          <form className="space-y-5" method="post" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200" htmlFor="username">Usuario</label>
              <input id="username" name="username" type="text" autoComplete="username" required autoFocus className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-4 pr-12 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 z-10 flex w-12 cursor-pointer items-center justify-center rounded-xl text-zinc-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showPassword ? <EyeOff aria-hidden="true" className="pointer-events-none" size={19} /> : <Eye aria-hidden="true" className="pointer-events-none" size={19} />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link href="/admin/forgot-password" className="text-sm text-zinc-400 transition hover:text-primary">¿Olvidaste tu contraseña?</Link>
              </div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 font-semibold text-luxury-black transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60">
              <LockKeyhole aria-hidden="true" size={18} />
              {isSubmitting ? "Verificando..." : "Ingresar"}
            </button>
          </form>
          <p className="mt-7 text-center text-xs leading-relaxed text-zinc-500">La sesión se cerrará automáticamente después de 8 horas.</p>
        </section>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-luxury-black" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
