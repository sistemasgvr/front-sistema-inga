"use client";

import { createContext } from 'react';
import type { ContextoImpresion } from '../types/impresion.types';

export const ImpresionContext = createContext<ContextoImpresion | null>(null);
