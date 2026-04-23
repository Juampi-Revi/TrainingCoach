import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  // 1. Coach
  const coachPasswordHash = await bcrypt.hash("juanjo123", 10);
  const coach = await prisma.user.upsert({
    where: { email: "juanjo@coach.com" },
    update: {},
    create: {
      email: "juanjo@coach.com",
      role: "coach",
      displayName: "Juanjo",
      passwordHash: coachPasswordHash,
    },
  });
  console.log("✅ Coach:", coach.email);

  // 2. Client
  const client = await prisma.user.findUniqueOrThrow({
    where: { email: "juampireviglioher@gmail.com" },
  });
  console.log("✅ Cliente:", client.email);

  // 3. Relación coach-cliente
  await prisma.coachClient.upsert({
    where: { clientUserId: client.id },
    update: { coachUserId: coach.id, status: "active" },
    create: { coachUserId: coach.id, clientUserId: client.id, status: "active" },
  });
  console.log("✅ Relación coach-cliente creada");

  // 4. Ejercicios
  const exerciseNames = [
    "Sentadilla con barra",
    "Prensa 45°",
    "Peso muerto rumano",
    "Estocadas caminando",
    "Hip thrust unilateral",
    "Abducciones",
    "Press de hombros con barra",
    "Press inclinado con barra",
    "Remo con apoyo",
    "Press hombro con mancuernas",
    "Jalón al pecho agarre neutro",
    "Crunch declinado",
    "Peso muerto convencional",
    "Hip thrust",
    "Sentadilla goblet",
    "Curl nórdico / Máquina isquios",
    "Estocada reversa",
    "Dominadas",
    "Fondos en paralelas / Polea tríceps",
    "Remo barra / Pendlay",
    "Extensión de tríceps",
    "Curl de bíceps",
    "Vuelos posteriores",
  ];

  const exercises: Record<string, string> = {};
  for (const name of exerciseNames) {
    const ex = await prisma.exercise.upsert({
      where: { coachUserId_name: { coachUserId: coach.id, name } },
      update: {},
      create: { coachUserId: coach.id, name, isSystem: false },
    });
    exercises[name] = ex.id;
  }
  console.log(`✅ ${exerciseNames.length} ejercicios creados/actualizados`);

  // 5. Plan
  const plan = await prisma.plan.create({
    data: {
      coachUserId: coach.id,
      title: "Juampi 12 Semanas – Recomposición",
      goal: "Reintroducir carga, mejorar fuerza en básicos, aumentar masa muscular y desarrollar base aeróbica (Zona 2)",
      notes: "Ciclo 1 de 3. Progresión RPE: S1=7, S2=8, S3=9, S4=6 (descarga). Priorizar técnica sobre carga.",
      weeksCount: 4,
      periodDays: 7,
      status: "published",
    },
  });
  console.log("✅ Plan creado:", plan.title);

  // 6. Workout templates (uno por tipo de entrenamiento)
  type WeeklyReps = { sets: number; reps: string; rpe?: number; rest?: number; notes?: string };
  type ExerciseDef = { name: string; weeks: WeeklyReps[] };

  const lowerAExercises: ExerciseDef[] = [
    {
      name: "Sentadilla con barra",
      weeks: [
        { sets: 5, reps: "5", rpe: 7, rest: 180 },
        { sets: 5, reps: "5", rpe: 8, rest: 180 },
        { sets: 5, reps: "5", rpe: 9, rest: 180 },
        { sets: 4, reps: "6", rpe: 6, rest: 180, notes: "Descarga – 60% del peso de S3" },
      ],
    },
    {
      name: "Prensa 45°",
      weeks: [
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "10", rest: 120 },
        { sets: 4, reps: "15", rest: 120, notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Peso muerto rumano",
      weeks: [
        { sets: 4, reps: "12" },
        { sets: 4, reps: "12" },
        { sets: 4, reps: "10" },
        { sets: 4, reps: "15", notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Estocadas caminando",
      weeks: [
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 3, reps: "12" },
        { sets: 1, reps: "18", notes: "Reducir 2 series, peso S1" },
      ],
    },
    {
      name: "Hip thrust unilateral",
      weeks: [
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 3, reps: "12" },
        { sets: 1, reps: "18", notes: "Reducir 2 series, peso S1" },
      ],
    },
    {
      name: "Abducciones",
      weeks: [
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 1, reps: "15", notes: "Reducir 2 series" },
      ],
    },
  ];

  const upperAExercises: ExerciseDef[] = [
    {
      name: "Press de hombros con barra",
      weeks: [
        { sets: 5, reps: "5", rpe: 7, rest: 180 },
        { sets: 5, reps: "5", rpe: 8, rest: 180 },
        { sets: 5, reps: "5", rpe: 9, rest: 180 },
        { sets: 4, reps: "6", rpe: 6, rest: 180, notes: "Descarga – 60% del peso de S3" },
      ],
    },
    {
      name: "Press inclinado con barra",
      weeks: [
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "10", rest: 120 },
        { sets: 4, reps: "15", rest: 120, notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Remo con apoyo",
      weeks: [
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "10", rest: 120 },
        { sets: 4, reps: "15", rest: 120, notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Press hombro con mancuernas",
      weeks: [
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 3, reps: "12" },
        { sets: 1, reps: "18", notes: "Reducir 2 series, peso S1" },
      ],
    },
    {
      name: "Jalón al pecho agarre neutro",
      weeks: [
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 3, reps: "12" },
        { sets: 1, reps: "18", notes: "Reducir 2 series, peso S1" },
      ],
    },
    {
      name: "Crunch declinado",
      weeks: [
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 3, reps: "15" },
        { sets: 1, reps: "15", notes: "Reducir 2 series" },
      ],
    },
  ];

  const lowerBExercises: ExerciseDef[] = [
    {
      name: "Peso muerto convencional",
      weeks: [
        { sets: 5, reps: "5", rpe: 7, rest: 180 },
        { sets: 5, reps: "5", rpe: 8, rest: 180 },
        { sets: 5, reps: "5", rpe: 9, rest: 180 },
        { sets: 4, reps: "6", rpe: 6, rest: 180, notes: "Descarga – 60% del peso de S3" },
      ],
    },
    {
      name: "Hip thrust",
      weeks: [
        { sets: 4, reps: "12" },
        { sets: 4, reps: "12" },
        { sets: 4, reps: "10" },
        { sets: 4, reps: "15", notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Sentadilla goblet",
      weeks: [
        { sets: 4, reps: "12" },
        { sets: 4, reps: "12" },
        { sets: 4, reps: "10" },
        { sets: 4, reps: "15", notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Curl nórdico / Máquina isquios",
      weeks: [
        { sets: 3, reps: "10-12" },
        { sets: 3, reps: "10-12" },
        { sets: 3, reps: "10-12" },
        { sets: 1, reps: "10-12", notes: "Reducir 2 series" },
      ],
    },
    {
      name: "Estocada reversa",
      weeks: [
        { sets: 3, reps: "12-15" },
        { sets: 3, reps: "12-15" },
        { sets: 3, reps: "12-15" },
        { sets: 1, reps: "12-15", notes: "Reducir 2 series" },
      ],
    },
  ];

  const upperBExercises: ExerciseDef[] = [
    {
      name: "Dominadas",
      weeks: [
        { sets: 10, reps: "3", notes: "EMOM 10' – 3 reps cada 60''. Total 30 reps." },
        { sets: 10, reps: "3", notes: "EMOM 10' – 3 reps cada 55''. Total 30 reps." },
        { sets: 10, reps: "3", notes: "EMOM 10' – 3 reps cada 50''. Total 30 reps." },
        { sets: 10, reps: "3", notes: "EMOM 10' – 3 reps cada 60'' (descarga)." },
      ],
    },
    {
      name: "Fondos en paralelas / Polea tríceps",
      weeks: [
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "10", rest: 120 },
        { sets: 4, reps: "20-25", rest: 120, notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Remo barra / Pendlay",
      weeks: [
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "12", rest: 120 },
        { sets: 4, reps: "10", rest: 120 },
        { sets: 4, reps: "15", rest: 120, notes: "Peso de semana 1" },
      ],
    },
    {
      name: "Extensión de tríceps",
      weeks: [
        { sets: 3, reps: "12" },
        { sets: 3, reps: "12" },
        { sets: 3, reps: "10" },
        { sets: 1, reps: "15", notes: "Reducir 2 series, peso S1" },
      ],
    },
    {
      name: "Curl de bíceps",
      weeks: [
        { sets: 3, reps: "12" },
        { sets: 3, reps: "12" },
        { sets: 3, reps: "10" },
        { sets: 1, reps: "15", notes: "Reducir 2 series, peso S1" },
      ],
    },
    {
      name: "Vuelos posteriores",
      weeks: [
        { sets: 3, reps: "12" },
        { sets: 3, reps: "12" },
        { sets: 3, reps: "10" },
        { sets: 1, reps: "15", notes: "Reducir 2 series, peso S1" },
      ],
    },
  ];

  type WorkoutDef = { title: string; description: string; exercises: ExerciseDef[] };

  const workoutDefs: WorkoutDef[] = [
    {
      title: "Lower A – Sentadilla",
      description: "Piernas dominante de sentadilla. Entrada en calor: movilidad cadera/tobillo, glute bridge 2×12, air squat 2×10.",
      exercises: lowerAExercises,
    },
    {
      title: "Upper A – Empuje + Tracción Horizontal",
      description: "Entrada en calor: movilidad hombros, band pull apart 2×15, scap push ups 2×10.",
      exercises: upperAExercises,
    },
    {
      title: "Lower B – Peso Muerto",
      description: "Piernas dominante de cadera. Entrada en calor: movilidad cadera, bird dog 2×10, glute bridge 2×12.",
      exercises: lowerBExercises,
    },
    {
      title: "Upper B – Tracción + Accesorios",
      description: "Tracción y accesorios de brazos y hombros.",
      exercises: upperBExercises,
    },
  ];

  // Crear 4 semanas × 4 entrenamientos = 16 workout templates
  const weekLabels = [
    { label: "RPE 7", note: "Semana 1 – RPE 7. Priorizar técnica, 1-2 reps en reserva." },
    { label: "RPE 8", note: "Semana 2 – RPE 8. Incrementar carga progresivamente." },
    { label: "RPE 9", note: "Semana 3 – RPE 9. Semana de máximo esfuerzo." },
    { label: "Descarga RPE 6", note: "Semana 4 – Descarga. 60% del peso de S3 en principales, peso de S1 en accesorios." },
  ];

  const createdTemplates: string[][] = [[], [], [], []]; // [weekIdx][workoutIdx]

  for (let wIdx = 0; wIdx < 4; wIdx++) {
    for (let dIdx = 0; dIdx < workoutDefs.length; dIdx++) {
      const def = workoutDefs[dIdx];
      const template = await prisma.workoutTemplate.create({
        data: {
          coachUserId: coach.id,
          title: `${def.title} – S${wIdx + 1} (${weekLabels[wIdx].label})`,
          description: def.description,
          type: "strength",
          workoutExercises: {
            create: def.exercises.map((ex, i) => ({
              exerciseId: exercises[ex.name],
              sortOrder: i,
              targetSets: ex.weeks[wIdx].sets,
              targetReps: ex.weeks[wIdx].reps,
              intensityType: ex.weeks[wIdx].rpe != null ? "rpe" : undefined,
              intensityTarget: ex.weeks[wIdx].rpe != null ? ex.weeks[wIdx].rpe : undefined,
              restSeconds: ex.weeks[wIdx].rest,
              notes: ex.weeks[wIdx].notes,
            })),
          },
        },
      });
      createdTemplates[wIdx].push(template.id);
    }
  }
  console.log("✅ 16 workout templates creados");

  // 7. PlanWeeks + PlanWeekWorkouts
  // Estructura: Lunes=LowerA, Miércoles=UpperA, Viernes=LowerB, Sábado=UpperB
  const weekDayOrder = [0, 1, 2, 3]; // LowerA, UpperA, LowerB, UpperB

  for (let wIdx = 0; wIdx < 4; wIdx++) {
    const planWeek = await prisma.planWeek.create({
      data: {
        planId: plan.id,
        weekNumber: wIdx + 1,
        title: `Semana ${wIdx + 1} – ${weekLabels[wIdx].label}`,
        notes: weekLabels[wIdx].note,
      },
    });

    for (let dIdx = 0; dIdx < weekDayOrder.length; dIdx++) {
      await prisma.planWeekWorkout.create({
        data: {
          planWeekId: planWeek.id,
          workoutTemplateId: createdTemplates[wIdx][weekDayOrder[dIdx]],
          sortOrder: dIdx,
          progressionNote: weekLabels[wIdx].note,
        },
      });
    }
  }
  console.log("✅ 4 semanas y workouts asignados");

  // 8. Asignar plan al cliente
  await prisma.planAssignment.create({
    data: {
      planId: plan.id,
      clientUserId: client.id,
      startDate: new Date("2026-04-21"), // Lunes próximo
      status: "active",
    },
  });
  console.log("✅ Plan asignado a", client.email);

  console.log("\n🎉 Seed completado!");
  console.log("   Coach:  juanjo@coach.com  /  juanjo123");
  console.log("   Cliente: juampireviglioher@gmail.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
