import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Barbers } from "@/components/sections/Barbers";
import { Services } from "@/components/sections/Services";
import { BookingGuide } from "@/components/sections/BookingGuide";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <About />
      <Barbers />
      <Services />
      <BookingGuide />
      <Testimonials />
      <CTA />
    </div>
  );
}
