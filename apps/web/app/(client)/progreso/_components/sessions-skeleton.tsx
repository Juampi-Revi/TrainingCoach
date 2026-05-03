import { Card, Skeleton } from "@/components/ui";

export function SessionsSkeleton() {
  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={180} height={13} />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <Skeleton width={100} height={11} />
              <Skeleton height={10} borderRadius={999} />
              <Skeleton width={50} height={11} />
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Skeleton width={16} height={16} borderRadius={4} />
            <Skeleton width={160} height={13} />
          </div>
          <Skeleton height={40} borderRadius={10} style={{ marginBottom: 10 }} />
          <Skeleton height={80} borderRadius={12} />
        </Card>
      </div>

      <div style={{ padding: "0 20px" }}>
        <Skeleton width={100} height={11} style={{ marginBottom: 10 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width={140} height={13} />
              <Skeleton width={80} height={12} />
            </div>
            <Skeleton width={180} height={11} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </>
  );
}
