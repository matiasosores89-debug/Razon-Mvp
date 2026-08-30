"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TEST_SITE_KEY = "1x00000000000000000000AA";

export function Turnstile({ action, onVerify, resetKey = 0 }: { action: string; onVerify: (token: string) => void; resetKey?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string>();
  const reactId = useId();
  const [status, setStatus] = useState<"loading" | "ready" | "verified" | "error">("loading");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (process.env.NODE_ENV !== "production" ? TEST_SITE_KEY : "");

  function renderWidget() {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetRef.current) return false;
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "dark",
      size: "flexible",
      appearance: "interaction-only",
      callback: (token: string) => { onVerify(token); setStatus("verified"); },
      "expired-callback": () => { onVerify(""); setStatus("ready"); },
      "error-callback": () => { onVerify(""); setStatus("error"); },
    });
    setStatus("ready");
    return true;
  }

  useEffect(() => {
    if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
    widgetRef.current = undefined;
    onVerify("");
    setStatus("loading");
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (renderWidget() || attempts >= 50) {
        window.clearInterval(interval);
        if (!widgetRef.current) setStatus("error");
      }
    }, 100);
    return () => {
      window.clearInterval(interval);
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = undefined;
    };
    // resetKey intentionally recreates the single-use challenge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, action, siteKey]);

  if (!siteKey) return <p role="alert" className="flex items-center gap-2 text-sm text-red-300"><ShieldAlert size={17} /> La verificación de seguridad no está configurada.</p>;

  return (
    <div className="space-y-3" aria-label="Verificación anti-spam">
      <Script id={`turnstile-${reactId}`} src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => { renderWidget(); }} onReady={() => { renderWidget(); }} onError={() => setStatus("error")} />
      <div ref={containerRef} className={status === "verified" ? "hidden" : "w-full overflow-hidden rounded-lg empty:hidden"} />
      <div aria-live="polite" className={`flex items-center gap-2 text-xs ${status === "verified" ? "text-emerald-300" : status === "error" ? "text-red-300" : "text-zinc-400"}`}>
        {status === "verified" ? <CheckCircle2 size={15} /> : status === "error" ? <ShieldAlert size={15} /> : <Loader2 size={15} className={status === "loading" ? "animate-spin" : ""} />}
        {status === "verified" ? "Protección anti-spam activa" : status === "error" ? "No pudimos cargar la verificación. Revisá tu conexión o desactivá el bloqueador para este sitio." : status === "loading" ? "Comprobando que la reserva sea segura..." : "Verificación de seguridad pendiente"}
      </div>
    </div>
  );
}
