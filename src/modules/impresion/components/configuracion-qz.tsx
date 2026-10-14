'use client';
import { useState, type FormEvent } from 'react';
import { FormModal } from '@/components/ui/modal/FormModal';
import { useQzConfiguracion } from '../hooks/use-qz-configuracion';

const inputArchivo = 'mt-1.5 block w-full cursor-pointer rounded-lg border border-gray-300 text-sm text-gray-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-gray-100 file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:border-gray-700 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-300';

export function ConfiguracionQzModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { configuracion, cargando, guardando, error, mensaje, guardar } = useQzConfiguracion();
  const [certificado, setCertificado] = useState<File | null>(null);
  const [clave, setClave] = useState<File | null>(null);
  const [version, setVersion] = useState(0);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!certificado || !clave) return;
    if (await guardar(certificado, clave)) {
      setCertificado(null); setClave(null); setVersion(value => value + 1);
    }
  }
  const estado = configuracion?.configurado ? `Certificado guardado · Vence: ${new Date(configuracion.vence!).toLocaleDateString('es-PE')}`
    : configuracion?.origen === 'archivo' ? 'Se usa la configuración de archivos del servidor.' : 'Sin certificado guardado en la base de datos.';
  return <FormModal isOpen={isOpen} onClose={onClose} onSubmit={submit}
    title="Certificado de impresión QZ Tray"
    subtitle="Configuración compartida por todas las estaciones."
    isSaving={guardando} submitDisabled={cargando || !certificado || !clave}
    submitText={configuracion?.configurado ? 'Reemplazar' : 'Guardar'}>
    <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-white/[0.03]">
      <p role="status" className="font-medium text-gray-800 dark:text-gray-200">{cargando ? 'Consultando configuración…' : estado}</p>
      {configuracion?.sujeto && <p className="mt-1 break-words text-xs text-gray-500">{configuracion.sujeto}</p>}
    </div>
    <fieldset disabled={cargando || guardando} key={version} className="space-y-4">
      <legend className="mb-3 text-sm text-gray-500">Para reemplazarla, selecciona el certificado y su clave privada juntos.</legend>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certificado (.txt, .crt o .pem)
        <input required type="file" accept=".txt,.crt,.pem" className={inputArchivo} onChange={event => setCertificado(event.target.files?.[0] ?? null)} />
      </label>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clave privada (.pem, sin contraseña)
        <input required type="file" accept=".pem" className={inputArchivo} onChange={event => setClave(event.target.files?.[0] ?? null)} />
      </label>
    </fieldset>
    <p className="text-xs text-gray-500">La clave privada no se muestra ni se descarga. QZ Tray debe estar instalado y confiar en el certificado en cada PC que imprime.</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {mensaje && <p role="status" className="text-sm text-emerald-600">{mensaje}</p>}
  </FormModal>;
}
