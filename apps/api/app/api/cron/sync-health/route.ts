import { NextRequest, NextResponse } from "next/server";
import { syncAllActiveConnections } from "@/lib/health/sync-engine";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllActiveConnections();
    return NextResponse.json({
      success: true,
      total: result.total,
      successCount: result.success,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Cron Sync Error]", err);
    return NextResponse.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
