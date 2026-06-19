"use client";

import { useOnboarding, type OnboardingGoal, type ExperienceLevel, type Equipment, type FocusArea } from "@/lib/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function OnboardingPage() {
  const {
    step,
    data,
    isSubmitting,
    error,
    setGoal,
    setExperience,
    setDaysPerWeek,
    setSessionDuration,
    toggleEquipment,
    toggleFocusArea,
    nextStep,
    prevStep,
    submit,
  } = useOnboarding();

  const progress = (step / 6) * 100;

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Configurá tu plan</h1>
          <p>Personalizá tu experiencia en pocos pasos</p>
          <Progress value={progress} total={100} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="step-content">
          {step === 1 && <GoalStep value={data.goal} onChange={setGoal} />}
          {step === 2 && <ExperienceStep value={data.experience} onChange={setExperience} />}
          {step === 3 && <DaysStep value={data.daysPerWeek} onChange={setDaysPerWeek} />}
          {step === 4 && <DurationStep value={data.sessionDuration} onChange={setSessionDuration} />}
          {step === 5 && <EquipmentStep value={data.equipment} onChange={toggleEquipment} />}
          {step === 6 && <FocusStep value={data.focusAreas} onChange={toggleFocusArea} />}
        </div>

        <div className="step-navigation">
          {step > 1 && (
            <Button variant="secondary" onClick={prevStep} disabled={isSubmitting}>
              Atrás
            </Button>
          )}
          
          {step < 6 ? (
            <Button 
              variant="primary" 
              onClick={nextStep}
              disabled={!canProceed(step, data)}
            >
              Continuar
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={submit}
              disabled={!canProceed(step, data) || isSubmitting}
            >
              {isSubmitting ? "Creando plan..." : "Crear mi plan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function canProceed(step: number, data: ReturnType<typeof useOnboarding>["data"]): boolean {
  switch (step) {
    case 1:
      return data.goal !== null;
    case 2:
      return data.experience !== null;
    case 3:
      return data.daysPerWeek >= 2 && data.daysPerWeek <= 6;
    case 4:
      return [30, 45, 60, 90].includes(data.sessionDuration);
    case 5:
      return data.equipment.length > 0;
    case 6:
      return data.focusAreas.length > 0;
    default:
      return false;
  }
}

import { Icon } from "@/components/ui";

function GoalStep({ value, onChange }: { value: OnboardingGoal | null; onChange: (g: OnboardingGoal) => void }) {
  const goals = [
    { id: "lose_weight", label: "Perder peso", iconName: "flame" as const },
    { id: "build_muscle", label: "Ganar músculo", iconName: "dumbbell" as const },
    { id: "maintain", label: "Mantenerme", iconName: "scale" as const },
    { id: "improve_endurance", label: "Mejorar resistencia", iconName: "activity" as const },
    { id: "general_fitness", label: "Fitness general", iconName: "star" as const },
  ];

  return (
    <div className="step">
      <h2>¿Cuál es tu objetivo principal?</h2>
      <div className="options-grid">
        {goals.map((goal) => (
          <button
            key={goal.id}
            className={`option-card ${value === goal.id ? "selected" : ""}`}
            onClick={() => onChange(goal.id as OnboardingGoal)}
          >
            <span className="icon">
              <Icon name={goal.iconName} size={24} color="var(--text)" />
            </span>
            <span className="label">{goal.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExperienceStep({ value, onChange }: { value: ExperienceLevel | null; onChange: (e: ExperienceLevel) => void }) {
  const levels = [
    { id: "beginner", label: "Principiante", description: "Nunca o casi nunca entrené" },
    { id: "intermediate", label: "Intermedio", description: "Entreno hace 6+ meses" },
    { id: "advanced", label: "Avanzado", description: "Entreno hace 2+ años" },
  ];

  return (
    <div className="step">
      <h2>¿Cuál es tu nivel de experiencia?</h2>
      <div className="options-list">
        {levels.map((level) => (
          <button
            key={level.id}
            className={`option-row ${value === level.id ? "selected" : ""}`}
            onClick={() => onChange(level.id as ExperienceLevel)}
          >
            <span className="label">{level.label}</span>
            <span className="description">{level.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DaysStep({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div className="step">
      <h2>¿Cuántos días por semana podés entrenar?</h2>
      <div className="days-selector">
        {[2, 3, 4, 5, 6].map((days) => (
          <button
            key={days}
            className={`day-btn ${value === days ? "selected" : ""}`}
            onClick={() => onChange(days)}
          >
            {days}
          </button>
        ))}
      </div>
      <p className="helper">{value} días por semana</p>
    </div>
  );
}

function DurationStep({ value, onChange }: { value: number; onChange: (d: 30 | 45 | 60 | 90) => void }) {
  const durations = [
    { id: 30, label: "30 min", description: "Rápido y efectivo" },
    { id: 45, label: "45 min", description: "Balance ideal" },
    { id: 60, label: "60 min", description: "Entrenamiento completo" },
    { id: 90, label: "90 min", description: "Intensivo" },
  ];

  return (
    <div className="step">
      <h2>¿Cuánto tiempo por sesión?</h2>
      <div className="options-grid small">
        {durations.map((dur) => (
          <button
            key={dur.id}
            className={`option-card ${value === dur.id ? "selected" : ""}`}
            onClick={() => onChange(dur.id as 30 | 45 | 60 | 90)}
          >
            <span className="label">{dur.label}</span>
            <span className="description">{dur.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EquipmentStep({ value, onChange }: { value: Equipment[]; onChange: (e: Equipment) => void }) {
  const equipment = [
    { id: "gym", label: "Gimnasio completo", iconName: "dumbbell" as const },
    { id: "dumbbells", label: "Mancuernas", iconName: "dumbbell" as const },
    { id: "home", label: "Equipo básico en casa", iconName: "home" as const },
    { id: "bodyweight", label: "Solo peso corporal", iconName: "user" as const },
  ];

  return (
    <div className="step">
      <h2>¿Qué equipo tenés disponible?</h2>
      <p className="subtitle">Seleccioná todas las opciones que apliquen</p>
      <div className="options-grid">
        {equipment.map((eq) => (
          <button
            key={eq.id}
            className={`option-card ${value.includes(eq.id as Equipment) ? "selected" : ""}`}
            onClick={() => onChange(eq.id as Equipment)}
          >
            <span className="icon">
              <Icon name={eq.iconName} size={24} color="var(--text)" />
            </span>
            <span className="label">{eq.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FocusStep({ value, onChange }: { value: FocusArea[]; onChange: (a: FocusArea) => void }) {
  const areas = [
    { id: "full_body", label: "Cuerpo completo", iconName: "target" as const },
    { id: "upper", label: "Tren superior", iconName: "dumbbell" as const },
    { id: "lower", label: "Tren inferior", iconName: "leg" as const },
    { id: "core", label: "Core", iconName: "scale" as const },
    { id: "cardio", label: "Cardio", iconName: "heart" as const },
  ];

  return (
    <div className="step">
      <h2>¿En qué querés enfocarte?</h2>
      <p className="subtitle">Seleccioná hasta {value.length >= 3 ? 3 : "3"} áreas</p>
      <div className="options-grid">
        {areas.map((area) => (
          <button
            key={area.id}
            className={`option-card ${value.includes(area.id as FocusArea) ? "selected" : ""}`}
            onClick={() => onChange(area.id as FocusArea)}
            disabled={!value.includes(area.id as FocusArea) && value.length >= 3}
          >
            <span className="icon">
              <Icon name={area.iconName} size={24} color="var(--text)" />
            </span>
            <span className="label">{area.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}