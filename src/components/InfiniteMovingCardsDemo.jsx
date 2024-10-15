"use client";

import React from "react";
import { InfiniteMovingCards } from "../acernity/InfiniteMovingCards";
import img1 from "../img/img1.jpg";
import img2 from "../img/img2.jpg";
import img3 from "../img/img3.jpg";
import img4 from "../img/img4.jpg";
import { desc, img } from "framer-motion/client";

export function InfiniteMovingCardsDemo() {
  return (
    <div className="h-[30rem] rounded-md flex flex-col antialiased bg-grid-white/[0.05] items-center justify-center relative overflow-hidden">
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="slow"
      />
    </div>
  );
}

const testimonials = [
  {
    img: img1,
    description: "Un paisaje de montaña en la puesta de sol, con un cielo naranja y nubes rosadas. Las montañas se reflejan en un lago tranquilo, creando una atmósfera serena y pacífica.",
  },
  {
    img: img2,
    description: "Una cocina acogedora y rústica con gabinetes de madera, un piso de madera y una estufa azul. La luz natural entra por una ventana grande, creando una atmósfera cálida y hogareña.",
  },
  {
    img: img3,
    description: "Un lago tranquilo en otoño, rodeado de árboles de colores vibrantes. Una pequeña barca de madera flota en el agua, con la niebla matutina creando una atmósfera mágica.",
  },
  {
    img: img4,
    description: "Un paisaje de montaña cubierto de nieve, con árboles cubiertos de nieve y un cielo azul claro. La luz del sol brilla sobre la nieve, creando una atmósfera brillante y fresca.",
  }
];
