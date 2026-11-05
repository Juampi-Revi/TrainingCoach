import { NextRequest, NextResponse } from "next/server";
import { sendDueSupplementReminders } from "@/lib/assistant/supplements.service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDueSupplementReminders();
    return NextResponse.json({
      success: true,
      sent: result.sent,
      pending: result.pending,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Cron Supplement Reminders]", err);
    return NextResponse.json(
      { error: "Reminders failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
