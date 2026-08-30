export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta configurar el servicio de correo");
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Recuperá tu acceso a Razor Admin",
      html: `<div style="font-family:Arial,sans-serif;color:#18181b"><h2>Restablecer contraseña</h2><p>Recibimos una solicitud para cambiar tu contraseña.</p><p><a href="${input.resetUrl}" style="display:inline-block;background:#ddb72c;color:#111;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Crear nueva contraseña</a></p><p>El enlace vence en 30 minutos. Si no hiciste esta solicitud, podés ignorar este correo.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("No se pudo enviar el correo de recuperación");
  return true;
}
