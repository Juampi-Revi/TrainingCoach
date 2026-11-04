export function runtimeEnv(name: string): string {
  return process.env[name] ?? "";
}
