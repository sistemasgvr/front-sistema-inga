import { apiPost } from "@/shared/api/api-client";

export async function uploadProductoImagenApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiPost<{ url: string }>("/productos/upload-imagen", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.url;
}