import { Skeleton } from "@/components/ui";

export function FoodSkeleton() {
  return (
    <div style={{ padding: "0 20px" }}>
      <Skeleton width={80} height={11} style={{ marginBottom: 10 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton width={140} height={12} />
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton width={50} height={12} />
              <Skeleton width={50} height={12} />
            </div>
          </div>
          <Skeleton width={80} height={10} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={12} style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}
