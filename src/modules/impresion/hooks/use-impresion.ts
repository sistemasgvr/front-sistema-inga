"use client";

import { useContext } from 'react';
import { ImpresionContext } from '../context/impresion-context';

export function useImpresion() {
  const value = useContext(ImpresionContext);
  if (!value) throw new Error('Falta ImpresionProvider');
  return value;
}
