function clean(value?: string | null) {
  return value?.trim() || "";
}

export function getApiBaseUrl() {
  return (
    clean(process.env.API_BASE_URL) ||
    clean(process.env.NEXTAUTH_URL) ||
    "http://localhost:3003"
  );
}

export function getWebBaseUrl() {
  return (
    clean(process.env.FRONTEND_URL) ||
    clean(process.env.NEXT_PUBLIC_WEB_URL) ||
    "http://localhost:3001"
  );
}
