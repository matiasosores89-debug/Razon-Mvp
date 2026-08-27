import Link from "next/link";
import { Scissors, MapPin, Phone, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-luxury-black border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                <Scissors size={20} />
              </div>
              <span className="text-lg font-bold tracking-tighter text-white">
                Sr.<span className="text-primary">bigote</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La excelencia en el cuidado masculino. Un espacio diseñado para el hombre moderno que busca precisión, estilo y relajación.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-white font-semibold mb-6">Explorar</h4>
            <ul className="space-y-4">
              <li><Link href="/#about" className="text-muted-foreground hover:text-primary text-sm transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/#barbers" className="text-muted-foreground hover:text-primary text-sm transition-colors">Nuestros Barberos</Link></li>
              <li><Link href="/#services" className="text-muted-foreground hover:text-primary text-sm transition-colors">Servicios</Link></li>
              <li><Link href="/#testimonials" className="text-muted-foreground hover:text-primary text-sm transition-colors">Experiencias</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-white font-semibold mb-6">Soporte</h4>
            <ul className="space-y-4">
              <li><Link href="/#contact" className="text-muted-foreground hover:text-primary text-sm transition-colors">Contacto</Link></li>
              <li><Link href="/#booking-guide" className="text-muted-foreground hover:text-primary text-sm transition-colors">Cómo reservar</Link></li>
              <li><Link href="/booking" className="text-muted-foreground hover:text-primary text-sm transition-colors">Reservar turno</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-white font-semibold mb-6">Ubicación</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li>
                <a href="https://www.google.com/maps/search/?api=1&query=Av.+Lujo+123,+Ciudad+Moderna" target="_blank" rel="noreferrer" className="flex gap-3 hover:text-primary transition-colors">
                  <MapPin size={18} className="text-primary shrink-0" aria-hidden="true" />
                  Av. Lujo 123, Ciudad Moderna, CP 4567
                </a>
              </li>
              <li>
                <a href="tel:+541112345678" className="flex gap-3 hover:text-primary transition-colors">
                  <Phone size={18} className="text-primary shrink-0" aria-hidden="true" />
                  +54 11 1234-5678
                </a>
              </li>
              <li>
                <a href="mailto:contacto@razormvp.com" className="flex gap-3 hover:text-primary transition-colors">
                  <Mail size={18} className="text-primary shrink-0" aria-hidden="true" />
                  contacto@razormvp.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} RAZOR MVP Luxury Barbershop. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
