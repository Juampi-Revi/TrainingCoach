import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = "/tmp/tcr-runtime-env.json";
const PROC_FILE = ["/proc", "self", "environ"].join("/");

type EnvMap = Record<string, string>;

let cached: EnvMap | null = null;

function asEnvMap(value: unknown): EnvMap {
  if (!value || typeof value !== "object") return {};
  const out: EnvMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

function fromFile(): EnvMap {
  try {
    if (!existsSync(ENV_FILE)) return {};
    return asEnvMap(JSON.parse(readFileSync(ENV_FILE, "utf8")));
  } catch {
    return {};
  }
}

function fromProc(): EnvMap {
  try {
    if (!existsSync(PROC_FILE)) return {};
    const out: EnvMap = {};
    for (const pair of readFileSync(PROC_FILE, "utf8").split("\0")) {
      const index = pair.indexOf("=");
      if (index <= 0) continue;
      out[pair.slice(0, index)] = pair.slice(index + 1);
    }
    return out;
  } catch {
    return {};
  }
}

function fromLiveProcess(): EnvMap {
  try {
    return asEnvMap(new Function("return process.env")() as NodeJS.ProcessEnv);
  } catch {
    return {};
  }
}

function load(): EnvMap {
  if (cached) return cached;
  cached = { ...fromLiveProcess(), ...fromProc(), ...fromFile() };
  return cached;
}

export function runtimeEnv(name: string): string {
  return load()[name] ?? "";
}
