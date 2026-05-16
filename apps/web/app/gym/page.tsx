"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

export default function GymDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const name = user?.name ?? "Gym";

  return (
    <DesktopShell active="dashboard" coachName={name}>
      <div style={{ padding: "24px 20px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Panel del Gym</div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 24 }}>
          Gestioná alumnos, clases y entrenamientos
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          <div
            onClick={() => router.push("/coach/alumnos")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="users" size={24} color="var(--lime)" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Alumnos</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Ver y gestionar alumnos</div>
          </div>
          <div
            onClick={() => router.push("/gym/clases")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="calendar" size={24} color="var(--success)" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Clases</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Programar y lanzar clases grupales</div>
          </div>
          <div
            onClick={() => router.push("/coach/alumnos/grupos")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="users" size={24} color="#7AB8FF" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Grupos</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Organizar alumnos por nivel</div>
          </div>
          <div
            onClick={() => router.push("/coach/planes")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="book" size={24} color="#FFB547" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Planes</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Crear y asignar planes</div>
          </div>
          <div
            onClick={() => router.push("/coach/workouts")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="dumbbell" size={24} color="var(--lime)" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Entrenamientos</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Biblioteca de plantillas</div>
          </div>
          <div
            onClick={() => router.push("/coach/ejercicios")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="search" size={24} color="#7AB8FF" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Ejercicios</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Biblioteca de ejercicios</div>
          </div>
          <div
            onClick={() => router.push("/coach/mensajes")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="msg" size={24} color="var(--success)" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Mensajes</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Chat con alumnos</div>
          </div>
          <div
            onClick={() => router.push("/coach/calendario")}
            style={{ padding: 18, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}
            className="ta-row"
          >
            <Icon name="calendar" size={24} color="#FFB547" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Calendario</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Agenda de clases y sesiones</div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}
