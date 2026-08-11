"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DatePicker from "@/components/form/date-picker";
import FileDropzone from "@/components/form/FileDropzone";
import Label from "@/components/form/Label";
import MultiSelect from "@/components/form/MultiSelect";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import Alert from "@/components/ui/alert/Alert";
import { useState } from "react";

const PHONE_COUNTRIES = [
  { code: "PE", label: "+51" },
  { code: "CO", label: "+57" },
  { code: "MX", label: "+52" },
  { code: "US", label: "+1" },
];

const PERMISSION_OPTIONS = [
  { value: "usuarios.leer", text: "Usuarios — leer", selected: false },
  { value: "usuarios.crear", text: "Usuarios — crear", selected: false },
  { value: "usuarios.editar", text: "Usuarios — editar", selected: false },
  { value: "reportes.ver", text: "Reportes — ver", selected: false },
];

export function AdvancedFormView() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Formularios avanzados" />

      <div className="mb-5">
        <Alert
          variant="info"
          title="Componentes Fase 4"
          message="DatePicker, MultiSelect, PhoneInput y Dropzone listos para reutilizar en cualquier módulo."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ComponentCard title="Fecha (Flatpickr)">
          <DatePicker
            id="demo-date"
            label="Fecha de referencia"
            placeholder="Selecciona una fecha"
            onChange={(_dates, dateStr) => setSelectedDate(dateStr)}
          />
          {selectedDate ? (
            <p className="text-theme-sm mt-3 text-gray-500 dark:text-gray-400">
              Seleccionado: {selectedDate}
            </p>
          ) : null}
        </ComponentCard>

        <ComponentCard title="Teléfono">
          <Label>Número de contacto</Label>
          <PhoneInput
            countries={PHONE_COUNTRIES}
            placeholder="+51 999 999 999"
            onChange={setPhone}
          />
          {phone ? (
            <p className="text-theme-sm mt-3 text-gray-500 dark:text-gray-400">
              Valor: {phone}
            </p>
          ) : null}
        </ComponentCard>

        <ComponentCard title="MultiSelect (permisos)">
          <MultiSelect
            label="Permisos"
            options={PERMISSION_OPTIONS}
            defaultSelected={["usuarios.leer"]}
            onChange={setPermissions}
          />
          {permissions.length > 0 ? (
            <p className="text-theme-sm mt-3 text-gray-500 dark:text-gray-400">
              {permissions.join(", ")}
            </p>
          ) : null}
        </ComponentCard>

        <ComponentCard title="Dropzone de archivos">
          <FileDropzone
            onFilesChange={(files) =>
              setFileNames(files.map((file) => file.name))
            }
          />
          {fileNames.length > 0 ? (
            <p className="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">
              {fileNames.length} archivo(s) listo(s) en memoria (sin API).
            </p>
          ) : null}
        </ComponentCard>
      </div>
    </div>
  );
}
