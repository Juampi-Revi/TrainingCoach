import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ok, err } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password, name, role } = body ?? {};

  if (!email || !password) return err("email and password required", 400);
  if (role && !["coach", "client"].includes(role)) return err("Invalid role", 400);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return err("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: name ?? email.split("@")[0],
      role: role ?? "client",
      billingStatus: "good",
    },
  });

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    billingStatus: user.billingStatus,
  });

  return ok(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
        billingStatus: user.billingStatus,
      },
    },
    201,
  );
}
