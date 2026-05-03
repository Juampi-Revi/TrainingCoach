import { Skeleton } from "@/components/ui";

export function MetricsSkeleton() {
  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ padding: 16, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <Skeleton width={120} height={12} style={{ marginBottom: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Skeleton width={40} height={10} style={{ marginBottom: 6 }} />
              <Skeleton height={40} borderRadius={10} />
            </div>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
                <Skeleton height={40} borderRadius={10} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Skeleton width={100} height={38} borderRadius={10} />
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ padding: 16, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <Skeleton width={100} height={12} style={{ marginBottom: 12 }} />
          <Skeleton height={80} borderRadius={8} />
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <Skeleton width={80} height={11} style={{ marginBottom: 10 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={70} height={14} />
            </div>
            <Skeleton width={160} height={11} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </>
  );
}
