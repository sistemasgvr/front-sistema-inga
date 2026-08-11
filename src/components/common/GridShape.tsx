import Image from "next/image";

/**
 * Decoración estática de esquinas (sin animaciones).
 * Preferir `AuthBrandPanel` en login para interacción con anime.js.
 */
export default function GridShape() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-0 right-0 w-[260px] opacity-50 xl:w-[420px]">
        <Image
          width={540}
          height={254}
          src="/images/shape/grid-01.svg"
          alt=""
          className="h-auto w-full"
        />
      </div>
      <div className="absolute bottom-0 left-0 w-[260px] opacity-50 xl:w-[420px]">
        <div className="rotate-180">
          <Image
            width={540}
            height={254}
            src="/images/shape/grid-01.svg"
            alt=""
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
