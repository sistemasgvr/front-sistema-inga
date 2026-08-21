"use client";

import { animate } from "animejs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function AuthBrandPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);
  const gridBottomRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const gridTop = gridTopRef.current;
    const gridBottom = gridBottomRef.current;
    const logo = logoRef.current;
    if (!panel || !gridTop || !gridBottom || !logo) return;

    animate(gridTop, {
      opacity: [0, 0.65],
      duration: 900,
      ease: "outQuad",
    });
    animate(gridBottom, {
      opacity: [0, 0.65],
      duration: 900,
      ease: "outQuad",
      delay: 120,
    });

    animate(logo, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 800,
      ease: "outCubic",
      delay: 150,
    });

    const onMove = (event: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      animate(gridTop, {
        translateX: x * -18,
        translateY: y * -14,
        duration: 450,
        ease: "outQuad",
      });

      animate(gridBottom, {
        translateX: x * 18,
        translateY: y * 14,
        duration: 450,
        ease: "outQuad",
      });

      animate(logo, {
        translateX: x * 10,
        translateY: y * 8,
        duration: 500,
        ease: "outQuad",
      });
    };

    const onLeave = () => {
      animate([gridTop, gridBottom, logo], {
        translateX: 0,
        translateY: 0,
        duration: 600,
        ease: "outCubic",
      });
    };

    const onLogoEnter = () => {
      animate(logo, {
        scale: 1.06,
        duration: 350,
        ease: "outQuad",
      });
    };

    const onLogoLeave = () => {
      animate(logo, {
        scale: 1,
        duration: 350,
        ease: "outQuad",
      });
    };

    panel.addEventListener("mousemove", onMove);
    panel.addEventListener("mouseleave", onLeave);
    logo.addEventListener("mouseenter", onLogoEnter);
    logo.addEventListener("mouseleave", onLogoLeave);

    return () => {
      panel.removeEventListener("mousemove", onMove);
      panel.removeEventListener("mouseleave", onLeave);
      logo.removeEventListener("mouseenter", onLogoEnter);
      logo.removeEventListener("mouseleave", onLogoLeave);
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className="bg-brand-950 relative hidden h-full w-full overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center"
    >
      <div
        ref={gridTopRef}
        className="pointer-events-none absolute top-0 right-0 w-[280px] opacity-0 xl:w-[420px]"
        aria-hidden
      >
        <Image
          width={540}
          height={254}
          src="/images/shape/grid-01.svg"
          alt=""
          className="h-auto w-full"
          priority
        />
      </div>

      <div
        ref={gridBottomRef}
        className="pointer-events-none absolute bottom-0 left-0 w-[280px] opacity-0 xl:w-[420px]"
        aria-hidden
      >
        <div className="rotate-180">
          <Image
            width={540}
            height={254}
            src="/images/shape/grid-01.svg"
            alt=""
            className="h-auto w-full"
            priority
          />
        </div>
      </div>

      <div
        ref={logoRef}
        className="relative z-10 flex max-w-sm cursor-default flex-col items-center px-8 opacity-0 will-change-transform"
      >
        <Link href="/login" className="mb-6 block">
          <Image
            width={220}
            height={112}
            src="/images/logo/logo-brand.png"
            alt="Ingá — Gastronomía Lambayecana"
            style={{ width: 220, height: 112, maxWidth: "none" }}
            className="object-contain brightness-0 invert drop-shadow-[0_0_18px_rgba(255,255,255,0.35)] transition-[filter] duration-300 hover:drop-shadow-[0_0_28px_rgba(255,255,255,0.55)]"
            priority
          />
        </Link>
        <p className="mt-2 text-center text-xs text-white/40">
          Gastronomía Lambayecana
        </p>
      </div>
    </div>
  );
}
