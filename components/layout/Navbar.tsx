"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Scissors } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { NavLink } from "@/types";
import { usePathname } from "next/navigation";

const navLinks: NavLink[] = [
  { label: "Inicio", href: "/#hero" },
  { label: "Nosotros", href: "/#about" },
  { label: "Barberos", href: "/#barbers" },
  { label: "Servicios", href: "/#services" },
  { label: "Contacto", href: "/#contact" },
];

export const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-luxury-black/80 backdrop-blur-md border-border py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground group-hover:scale-110 transition-transform">
            <Scissors size={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">
            Sr.<span className="text-primary">bigote</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="primary" size="sm" className="font-semibold">
            <Link href="/booking">Reservar turno</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="md:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-navigation"
        className={cn(
          "absolute top-full left-0 right-0 bg-luxury-black border-b border-border transition-all duration-300 overflow-hidden",
          isOpen ? "max-h-screen opacity-100 py-6" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-medium text-muted-foreground hover:text-primary py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="primary" className="w-full py-6 text-lg">
            <Link href="/booking" onClick={() => setIsOpen(false)}>Reservar turno</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};
