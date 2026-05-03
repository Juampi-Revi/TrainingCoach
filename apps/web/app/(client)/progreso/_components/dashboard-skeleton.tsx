import { Card, Skeleton } from "@/components/ui";

export function DashboardSkeleton() {
  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <Skeleton width={60} height={10} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={20} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={120} height={13} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
                <Skeleton width={80} height={18} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={140} height={13} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
                <Skeleton width={70} height={18} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, marginTop: 12 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <Skeleton key={i} height={14} borderRadius={4} />
            ))}
          </div>
        </Card>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={80} height={13} />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Skeleton width={100} height={14} />
                <Skeleton width={60} height={12} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
