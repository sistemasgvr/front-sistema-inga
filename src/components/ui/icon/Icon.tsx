"use client";

import { Icon as IconifyIcon } from "@iconify/react";
import type { CSSProperties } from "react";

export type IconProps = {
  /** Nombre Iconify, ej. `mdi:home`, `lucide:user`, `solar:eye-bold` */
  name: string;
  /** Tamaño (px number o CSS string). Default: `1.25rem` */
  size?: number | string;
  /** Color CSS (`currentColor`, `#E51B23`, `var(--color-brand-500)`…) */
  color?: string;
  className?: string;
  /** Rotación Iconify: 1=90°, 2=180°, 3=270° */
  rotate?: 0 | 1 | 2 | 3;
  flip?: "horizontal" | "vertical" | "both";
  /** Alineación tipo icon font */
  inline?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  style?: CSSProperties;
  onClick?: () => void;
};

/**
 * Icono reutilizable basado en [Iconify](https://iconify.design/).
 *
 * @example
 * <Icon name="mdi:account" size={20} color="currentColor" />
 * <Icon name="lucide:search" className="text-brand-500" size="1.5rem" />
 */
export function Icon({
  name,
  size = "1.25rem",
  color = "currentColor",
  className,
  rotate,
  flip,
  inline = false,
  title,
  style,
  onClick,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const resolvedAriaHidden =
    ariaHidden ?? (ariaLabel || title ? undefined : true);

  return (
    <IconifyIcon
      icon={name}
      width={size}
      height={size}
      color={color}
      rotate={rotate}
      flip={flip}
      inline={inline}
      className={className}
      style={style}
      aria-label={ariaLabel ?? title}
      aria-hidden={resolvedAriaHidden}
      onClick={onClick}
    />
  );
}

export default Icon;
