export const NETWORK_ERROR_MESSAGE =
  "Sin conexión con el servidor. Reintentá en unos segundos.";

export const FETCH_TIMEOUT_MS = 12_000;
export const RETRY_DELAYS_MS = [400, 1200];

export function isRetryableStatus(status: number): boolean {
  return status === 0 || status === 408 || status === 502 || status === 503 || status === 504;
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("status" in error && (error as { status: unknown }).status === 0) return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { timeoutMs?: number; delaysMs?: number[] } = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  const delays = options.delaysMs ?? RETRY_DELAYS_MS;
  const maxAttempts = delays.length + 1;
  let lastNetworkError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const parentSignal = init.signal;
    const onParentAbort = () => controller.abort();
    parentSignal?.addEventListener("abort", onParentAbort);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (isRetryableStatus(res.status) && attempt < maxAttempts - 1) {
        await sleep(delays[attempt] ?? 1000);
        continue;
      }
      return res;
    } catch (error) {
      lastNetworkError = error;
      if (attempt >= maxAttempts - 1) break;
      await sleep(delays[attempt] ?? 1000);
    } finally {
      clearTimeout(timer);
      parentSignal?.removeEventListener("abort", onParentAbort);
    }
  }

  throw lastNetworkError instanceof Error ? lastNetworkError : new Error("fetch failed");
}
