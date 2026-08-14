import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: string[] | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagina: number;
    limite: number;
    total: number;
  };
  errors?: string[] | null;
}

export interface PaginatedResult<T> {
  data: T;
  meta: {
    pagina: number;
    limite: number;
    total: number;
  };
}

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let getAccessToken: () => string | null = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

let handleUnauthorized: (options: { sessionExpired: boolean }) => void = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
};

export function configureApiClient(options: {
  getAccessToken: () => string | null;
  onUnauthorized: (options: { sessionExpired: boolean }) => void;
}) {
  getAccessToken = options.getAccessToken;
  handleUnauthorized = options.onUnauthorized;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined as unknown as string);
    } else {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }

  return config;
});

function normalizeApiMessage(message: unknown, fallback: string): string {
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (Array.isArray(message)) {
    const joined = message.map(String).filter(Boolean).join(' · ');
    if (joined) return joined;
  }
  return fallback;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message?: unknown; errors?: string[] | null }>(error)) {
      const statusCode = error.response?.status ?? 500;
      const payload = error.response?.data;

      if (statusCode === 401) {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        const hadToken = Boolean(getAccessToken());

        if (!isLoginRequest && hadToken) {
          handleUnauthorized({ sessionExpired: true });
        }
      }

      throw new ApiError(
        normalizeApiMessage(payload?.message, error.message || 'Error de conexión'),
        statusCode,
        payload?.errors ?? null,
      );
    }

    throw new ApiError('Error de conexión con el servidor', 500);
  },
);

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const payload = response.data;

  if (payload == null || typeof payload !== 'object') {
    throw new ApiError('Respuesta inválida del servidor', 500);
  }

  if (payload.success === false) {
    const failed = payload as ApiResponse<T> & { errors?: string[] | null };
    throw new ApiError(
      normalizeApiMessage(failed.message, 'La operación no se pudo completar'),
      400,
      failed.errors ?? null,
    );
  }

  if (payload.data === undefined) {
    throw new ApiError(
      normalizeApiMessage(payload.message, 'El servidor no devolvió datos'),
      500,
    );
  }

  return payload.data;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return unwrapResponse(response);
}

export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedResult<T[]>> {
  const response = await apiClient.get<ApiResponse<T[]>>(url, config);
  const data = response.data.data ?? ([] as T[]);
  const meta = response.data.meta ?? {
    pagina: 1,
    limite: data.length,
    total: data.length,
  };

  return { data, meta };
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config);
  return unwrapResponse(response);
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body, config);
  return unwrapResponse(response);
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body, config);
  return unwrapResponse(response);
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return unwrapResponse(response);
}