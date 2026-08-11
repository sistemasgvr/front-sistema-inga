"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login } from "../services/auth.service";
import type { LoginFormErrors } from "../types/auth.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): LoginFormErrors {
    const next: LoginFormErrors = {};

    if (!email.trim()) {
      next.email = "El correo es obligatorio.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Ingresa un correo válido.";
    }

    if (!password) {
      next.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      next.password = "Mínimo 6 caracteres.";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login({
        email,
        password,
        rememberMe,
      });

      if (!result.ok) {
        setErrors({ form: result.message });
        return;
      }

      // Temporary destination until admin shell (Fase 2)
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({
        form: "No se pudo iniciar sesión. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    errors,
    isSubmitting,
    handleSubmit,
  };
}
