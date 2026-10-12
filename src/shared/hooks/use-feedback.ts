"use client";

import { useEffect, useRef, useState } from "react";
import { useToast, type ToastVariant } from "@/components/ui/toast/ToastContext";

type Feedback = { variant: ToastVariant; title: string; message: string };

/** Conserva el estado que necesitan los formularios y publica cada aviso una sola vez. */
export function useFeedback<T extends Feedback | null>(initial: T) {
  const [feedback, setFeedback] = useState<T>(initial);
  const previous = useRef<T | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (feedback && feedback !== previous.current) {
      toast(feedback.variant, feedback.title, feedback.message);
    }
    previous.current = feedback;
  }, [feedback, toast]);

  return [feedback, setFeedback] as const;
}
