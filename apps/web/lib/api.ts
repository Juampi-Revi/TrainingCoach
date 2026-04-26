const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { body, token, headers: extraHeaders, ...rest } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(`No se pudo conectar con la API (${API_BASE})`, 0);
  }

  let json: { ok?: boolean; data?: T; error?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`HTTP ${res.status} — respuesta no válida desde ${path}`, res.status);
  }

  if (!res.ok || !json?.ok) {
    throw new ApiError(json?.error ?? "Request failed", res.status);
  }

  return json.data as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createClient(token: string | null) {
  const t = token ?? undefined;
  return {
    get: <T>(path: string) => request<T>(path, { method: "GET", token: t }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body, token: t }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PUT", body, token: t }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body, token: t }),
    del: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "DELETE", body, token: t }),
  };
}

export { request };
