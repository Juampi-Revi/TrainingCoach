import crypto from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32[bytes[i] & 31];
  }
  return secret;
}

export function verifyTOTP(secret: string, token: string): boolean {
  if (token.length !== 6 || !/^\d{6}$/.test(token)) return false;

  const now = Math.floor(Date.now() / 1000);
  const step = 30;

  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now + offset * step) / step);
    if (generateTOTP(secret, counter) === token) return true;
  }
  return false;
}

function generateTOTP(secret: string, counter: number): string {
  const key = base32Decode(secret);

  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac("sha1", key).update(counterBytes).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1000000).padStart(6, "0");
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < input.length; i++) {
    const idx = alphabet.indexOf(input[i].toUpperCase());
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}
