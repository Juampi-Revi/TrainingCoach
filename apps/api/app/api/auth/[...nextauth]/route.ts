import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
}

export const POST = GET;
