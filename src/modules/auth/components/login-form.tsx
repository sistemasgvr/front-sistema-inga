"use client";

import BrandLogo from "@/components/common/BrandLogo";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
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
            Ingresa tu correo electrónico y contraseña para continuar.
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
                Correo electrónico <span className="text-error-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@inga.pe"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(errors.email)}
                hint={errors.email}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="password">
                Contraseña <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
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
              >
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}