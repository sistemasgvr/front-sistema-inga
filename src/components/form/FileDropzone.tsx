"use client";

import { Icon } from "@/components/ui/icon";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";

type FileDropzoneProps = {
  onFilesChange?: (files: File[]) => void;
  accept?: Record<string, string[]>;
  title?: string;
  description?: string;
};

export default function FileDropzone({
  onFilesChange,
  accept = {
    "image/png": [],
    "image/jpeg": [],
    "image/webp": [],
    "image/svg+xml": [],
  },
  title = "Arrastra y suelta archivos aquí",
  description = "PNG, JPG, WebP o SVG — o haz clic para seleccionar",
}: FileDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    onFilesChange?.(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
  });

  return (
    <div className="space-y-3">
      <div className="cursor-pointer rounded-xl border border-dashed border-gray-300 transition hover:border-brand-500 dark:border-gray-700 dark:hover:border-brand-500">
        <div
          {...getRootProps()}
          className={`rounded-xl border-dashed p-7 lg:p-10 ${
            isDragActive
              ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
              : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
          }`}
        >
          <input {...getInputProps()} />
          <div className="m-0! flex flex-col items-center">
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <Icon name="mdi:cloud-upload-outline" size={28} />
              </div>
            </div>

            <h4 className="text-theme-xl mb-3 font-semibold text-gray-800 dark:text-white/90">
              {isDragActive ? "Suelta los archivos aquí" : title}
            </h4>
            <span className="mb-5 block w-full max-w-[290px] text-center text-sm text-gray-700 dark:text-gray-400">
              {description}
            </span>
            <span className="text-theme-sm text-brand-500 font-medium underline">
              Seleccionar archivo
            </span>
          </div>
        </div>
      </div>

      {files.length > 0 ? (
        <ul className="text-theme-sm space-y-1 text-gray-600 dark:text-gray-400">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`}>
              {file.name} ({Math.round(file.size / 1024)} KB)
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
