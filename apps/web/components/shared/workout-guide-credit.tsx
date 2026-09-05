export function WorkoutGuideCredit({ compact = false }: { compact?: boolean }) {
  return (
    <p style={{ margin: 0, fontSize: compact ? 10 : 11, color: "var(--text-mute)", lineHeight: 1.5 }}>
      Ilustraciones de ejercicios básicos por{" "}
      <a
        href="https://bryllim.github.io/workout-guide/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--text-dim)", textDecoration: "underline" }}
      >
        Workout Guide
      </a>{" "}
      (CC BY-SA 4.0).
    </p>
  );
}
