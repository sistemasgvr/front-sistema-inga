import Image from "next/image";

type BrandLogoProps = {
  /** Compact mark for collapsed sidebar */
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

/**
 * Logo tipográfico Ingá (rojo).
 * - Modo claro: color original.
 * - Modo oscuro: máscara blanca + glow interno (`brightness-0 invert` + drop-shadow).
 */
export default function BrandLogo({
  compact = false,
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
        className={`h-10 w-10 object-contain dark:brightness-0 dark:invert dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.55)] ${className}`}
      />
    );
  }

  return (
    <Image
      src="/images/logo/logo-brand.png"
      alt="Ingá"
      width={180}
      height={92}
      priority={priority}
      className={`h-12 w-auto object-contain dark:brightness-0 dark:invert dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] ${className}`}
    />
  );
}
