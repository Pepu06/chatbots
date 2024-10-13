"use client";
import { cn } from "../lib/utils";

export function OnlyImgCard({ img, text }) {
  // Desestructurando 'img' correctamente
  return (
    <div className="max-w-xs w-full">
      <div
        className={cn(
          "group w-full cursor-pointer overflow-hidden relative card h-80 rounded-xl shadow-xl mx-auto flex flex-col justify-end p-4 border border-transparent dark:border-neutral-800",
          "bg-cover transition-all duration-500"
        )}
        style={{ backgroundImage: `url('${img}')` }} // Usando 'img' como fondo
      >
        {/* Aquí puedes agregar contenido adicional si lo deseas */}
      </div>
      <div className="text relative z-50">
        <p className="font-medium text-sm text-gray-300 relative my-4">
          {text}
        </p>
      </div>
    </div>
  );
}
