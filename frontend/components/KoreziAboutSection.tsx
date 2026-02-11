"use client";

import { useMemo, useState } from "react";

export default function KoreziAboutSection() {
  const [open, setOpen] = useState(false);

  // You can edit this content anytime
  const content = useMemo(
    () => ({
      title: "What Kinds of Korean Skincare & Beauty Products Does Korezi Offer?",
      intro: [
        "Korezi is Bangladesh’s trusted destination for authentic Korean skincare and beauty products. We offer a carefully curated range of items that address all your skincare concerns and daily beauty needs.",
        "Whether your goal is hydration, acne control, skin barrier repair, or long-lasting glow, Korezi brings solutions designed for every skin type, age group, and lifestyle.",
        "Our versatile collection includes everything from essential skincare products to advanced treatment solutions. From gentle daily cleansers to targeted serums and protective sunscreens, Korezi ensures you never have to compromise on quality, authenticity, or variety.",
      ],
      subTitle: "Here’s a Quick Look at The Categories We Offer —",
      blocks: [
        {
          h: "Skincare Products",
          p: "At Korezi, skincare is at the heart of everything we do. Our collection covers complete routines — from basic daily care to advanced skin treatments. You’ll find cleansers, toners, serums, essences, moisturizers, face oils, sunscreens, exfoliators, sheet masks, clay masks, pimple patches, and eye creams.",
        },
        {
          h: "Makeup Essentials",
          p: "Enhance your natural beauty with our curated range of makeup essentials. From foundations, BB & CC creams, concealers, and setting powders to lip tints, lip glosses, blushes, highlighters, brow products, and eyeliners — Korezi offers makeup suitable for both everyday wear and special occasions.",
        },
        {
          h: "Bath & Body Care",
          p: "Complete your self-care routine with nourishing bath and body products. Korezi offers body washes, body scrubs, lotions, creams, body butters, deodorants, hand creams, and foot care treatments — selected to cleanse, hydrate, and protect your skin.",
        },
        {
          h: "Accessories & Beauty Tools",
          p: "A flawless skincare or makeup routine needs the right tools. At Korezi, you’ll find makeup brushes, blending sponges, cotton pads, tweezers, eyelash curlers, razors, and precision applicators to help you get better results at home.",
        },
        {
          h: "Men’s Care Products",
          p: "Korezi also offers a growing range of men’s grooming essentials — face washes, moisturizers, shaving creams, aftershaves, sunscreens, and styling products to keep routines simple and effective.",
        },
        {
          h: "Baby Care Essentials",
          p: "For the most delicate skin, Korezi provides baby care products with gentle, dermatologically tested formulas — including body washes, lotions, diaper rash creams, baby wipes, and sunscreens.",
        },
      ],
      brandsTitle: "Featured Brands & New Arrivals",
      brandsText:
        "Korezi is committed to offering only 100% authentic products from trusted brands. We regularly add new arrivals and trending skincare so you can stay ahead of the latest K-beauty innovations.",
      whyTitle: "Why Choose Korezi?",
      whyText:
        "Korezi is more than an online store — we’re your skincare partner. We focus on authenticity, transparent pricing, secure shopping, and fast delivery across Bangladesh. Our goal is simple: help you build the right routine with confidence.",
    }),
    []
  );

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="rounded-3xl  p-8 md:p-4">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-semibold leading-tight">
          {content.title}
        </h2>

        {/* Intro */}
        <div className="mt-5 space-y-4 text-sm md:text-[15px] leading-relaxed text-gray-700">
          {content.intro.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>

        {/* Secondary headline */}
        <h3 className="mt-8 text-lg md:text-xl font-semibold">
          {content.subTitle}
        </h3>

        {/* Read more toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 text-sm font-medium text-[#BE171F] hover:underline inline-flex items-center gap-2"
        >
          {open ? "Show less" : "Read more"}
          <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ›
          </span>
        </button>

        {/* Expandable content */}
        <div
          className={[
            "grid transition-all duration-300 ease-in-out",
            open ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0 mt-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            {/* Category paragraphs */}
            <div className="space-y-5 text-sm md:text-[15px] leading-relaxed text-gray-700">
              {content.blocks.map((b, i) => (
                <div key={i}>
                  <p className="font-semibold text-gray-900">{b.h}</p>
                  <p className="mt-1">{b.p}</p>
                </div>
              ))}

              <div className="pt-2">
                <p className="font-semibold text-gray-900">{content.brandsTitle}</p>
                <p className="mt-1">{content.brandsText}</p>
              </div>

              <div className="pt-2">
                <p className="font-semibold text-gray-900">{content.whyTitle}</p>
                <p className="mt-1">{content.whyText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
