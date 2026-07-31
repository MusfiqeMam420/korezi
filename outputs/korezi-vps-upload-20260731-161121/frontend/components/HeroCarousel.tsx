"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

type Slide = {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
};

const slides: Slide[] = [
  {
    id: 1,
    title: "Warm Up Winter Combo",
    subtitle: "Season’s best care, perfectly packed for you",
    cta: "Shop Now",
    href: "/shop?brand=ordinary",
    image: "/banner/1.png",
  },
  {
    id: 2,
    title: "Glow Essentials",
    subtitle: "Hydration + repair for cold weather",
    cta: "Explore",
    href: "/shop?brand=seoul",
    image: "/banner/2.png",
  }
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  // auto slide
  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];

  return (
    <section className="max-w-7xl mx-auto px-6 pt-6">
      <div className="relative rounded-xl overflow-hidden h-[260px] sm:h-[340px] md:h-[420px] bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Background image */}
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority
              className="object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="px-6 sm:px-10 max-w-xl text-white">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-semibold"
                >
                  {slide.title}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 text-sm sm:text-base text-gray-100"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-5"
                >
                  <Link
                    href={slide.href}
                    className="inline-block px-6 py-3 rounded- bg-[#BE171F] hover:bg-black transition font-medium"
                  >
                    {slide.cta}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-4 right-5 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                index === i ? "w-6 bg-white" : "w-2.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
