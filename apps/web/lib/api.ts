const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private token: string | null;
  
  constructor(token: string | null) {
    this.token = token;
  }
  
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(`No se pudo conectar con la API (${API_BASE})`, 0);
    }

    let json: { ok?: boolean; data?: T; error?: string; details?: unknown } | null = null;
    try {
      json = await res.json();
    } catch {
      throw new ApiError(`HTTP ${res.status} — respuesta no válida desde ${path}`, res.status);
    }

    if (!res.ok || !json?.ok) {
      const error = new ApiError(json?.error ?? "Request failed", res.status);
      // Attach details if available (for validation errors)
      if (json?.details) {
        (error as Error & { details?: unknown }).details = json.details;
      }
      throw error;
    }

    return json.data as T;
  }

  async requestFormData<T>(method: string, path: string, body: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, { method, headers, body });
    } catch {
      throw new ApiError(`No se pudo conectar con la API (${API_BASE})`, 0);
    }

    let json: { ok?: boolean; data?: T; error?: string; details?: unknown } | null = null;
    try {
      json = await res.json();
    } catch {
      throw new ApiError(`HTTP ${res.status} — respuesta no válida desde ${path}`, res.status);
    }

    if (!res.ok || !json?.ok) {
      const error = new ApiError(json?.error ?? "Request failed", res.status);
      if (json?.details) {
        (error as Error & { details?: unknown }).details = json.details;
      }
      throw error;
    }

    return json.data as T;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  postForm<T>(path: string, body: FormData) {
    return this.requestFormData<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }

  del<T>(path: string, body?: unknown) {
    return this.request<T>("DELETE", path, body);
  }
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { body, token, ...rest } = opts;
  const client = new ApiClient(token ?? null);
  return client.request<T>(rest.method ?? "GET", path, body);
}

export function createClient(token: string | null) {
  return new ApiClient(token);
}

export { request };
