export interface Barber {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  image: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: any; // Lucide icon component
  price: string;
  duration: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  image: string;
}

export interface NavLink {
  label: string;
  href: string;
}
