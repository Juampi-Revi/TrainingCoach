import { Skeleton } from "@/components/ui";

export function SleepSkeleton() {
  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <Skeleton width={140} height={12} />
            <Skeleton width={60} height={11} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {[60, 40, 75, 50, 85, 45, 65].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6 }}>
                <Skeleton height={`${h}%`} borderRadius={6} />
                <Skeleton height={10} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <Skeleton width={80} height={11} style={{ marginBottom: 10 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={60} height={12} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
