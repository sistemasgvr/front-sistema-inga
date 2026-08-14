"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../services/auth.service";
import type { LoginFormErrors } from "../types/auth.types";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: LoginFormErrors = {};
    if (!email.trim()) {
      newErrors.email = "Ingresa tu correo electrónico.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Ingresa un correo electrónico válido.";
    }

    if (!password) {
      newErrors.password = "Ingresa tu contraseña.";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const result = await login({
      email,
      password,
      rememberMe,
    });

    if (!result.ok) {
      setErrors({ form: result.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  };

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