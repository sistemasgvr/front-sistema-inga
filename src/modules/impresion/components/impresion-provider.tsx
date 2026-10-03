"use client";

import type { ReactNode } from 'react';
import { ImpresionContext } from '../context/impresion-context';
import { useReceptorImpresion } from '../hooks/use-receptor-impresion';

export function ImpresionProvider({ children }: { children: ReactNode }) {
  const receptor = useReceptorImpresion();
  return <ImpresionContext.Provider value={receptor}>{children}</ImpresionContext.Provider>;
}
