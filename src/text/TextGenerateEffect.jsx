"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "../lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 2,
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");

  useEffect(() => {
    const animateWords = async () => {
      while (true) {
        await animate(
          "span",
          {
            opacity: 1,
            filter: filter ? "blur(0px)" : "none",
          },
          {
            duration: duration ? duration : 1,
            delay: stagger(0.2),
          }
        );

        // Esperar un tiempo antes de reiniciar la animación
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Reiniciar la animación para que los spans sean invisibles de nuevo
        await animate(
          "span",
          {
            opacity: 0,
            filter: filter ? "blur(10px)" : "none",
          },
          {
            duration: duration ? duration : 1,
            delay: stagger(0.2),
          }
        );
      }
    };

    animateWords();
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-black opacity-0"
              style={{
                filter: filter ? "blur(10px)" : "none",
              }}
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-black text-2xl leading-snug tracking-wide">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
