import Image from "next/image";

type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  /** Compact mark for collapsed sidebar */
  compact?: boolean;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
};

/** Ratio del asset 600×306 ≈ 1.96 */
const SIZE_PX: Record<BrandLogoSize, { width: number; height: number }> = {
  sm: { width: 71, height: 36 },
  md: { width: 94, height: 48 },
  lg: { width: 110, height: 56 },
};

/**
 * Logo tipográfico Ingá (rojo).
 * - Modo claro: color original.
 * - Modo oscuro: máscara blanca + glow.
 *
 * Importante: Tailwind preflight pone `img { height: auto; max-width: 100% }`,
 * lo que dispara el warning de next/image. Por eso fijamos width+height en style.
 */
export default function BrandLogo({
  compact = false,
  size = "md",
  className = "",
  priority = false,
}: BrandLogoProps) {
  if (compact) {
    return (
      <Image
        src="/images/logo/logo-brand.png"
        alt="Ingá"
        width={40}
        height={40}
        priority={priority}
        style={{ width: 40, height: 40, maxWidth: "none" }}
        className={`object-contain dark:brightness-0 dark:invert dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.55)] ${className}`}
      />
    );
  }

  const { width, height } = SIZE_PX[size];

  return (
    <Image
      src="/images/logo/logo-brand.png"
      alt="Ingá"
      width={width}
      height={height}
      priority={priority}
      style={{ width, height, maxWidth: "none" }}
      className={`object-contain dark:brightness-0 dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] ${className}`}
    />
  );
}
