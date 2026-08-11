"use client";

import BrandLogo from "@/components/common/BrandLogo";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Icon } from "@/components/ui/icon";
import { useLogin } from "../hooks/use-login";

export function LoginForm() {
  const {
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
  } = useLogin();

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-2 sm:px-0">
        <div className="mb-8 lg:hidden">
          <BrandLogo size="lg" priority />
        </div>

        <div className="mb-6 sm:mb-8">
          <p className="text-theme-sm text-brand-600 mb-2 font-medium dark:text-brand-400">
            Bienvenido
          </p>
          <h1 className="text-title-sm sm:text-title-md mb-2 font-semibold text-gray-800 dark:text-white/90">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingresa tu correo y contraseña para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {errors.form ? (
              <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
                {errors.form}
              </div>
            ) : null}

            <div>
              <Label htmlFor="email">
                Correo <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-gray-400">
                  <Icon name="mdi:email-outline" size={20} />
                </span>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@inga.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={Boolean(errors.email)}
                  hint={errors.email}
                  disabled={isSubmitting}
                  className="pl-11"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">
                Contraseña <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-gray-400">
                  <Icon name="mdi:lock-outline" size={20} />
                </span>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  error={Boolean(errors.password)}
                  hint={errors.password}
                  disabled={isSubmitting}
                  className="pr-11 pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3.5 z-30 -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-400"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  <Icon
                    name={showPassword ? "mdi:eye-outline" : "mdi:eye-off-outline"}
                    size={20}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={setRememberMe}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-theme-sm block font-normal text-gray-700 dark:text-gray-400"
                >
                  Recordarme
                </label>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <Icon name="mdi:loading" size={18} className="animate-spin" />
                  ) : (
                    <Icon name="mdi:login" size={18} />
                  )
                }
              >
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </Button>
            </div>

            <p className="text-theme-xs text-center text-gray-400 dark:text-gray-500">
              Demo: admin@inga.com / admin123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
