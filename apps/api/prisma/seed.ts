import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

function utcDay(daysAgo: number) {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d
}

function utcDateTime(daysAgo: number, hour = 18, minute = 0) {
  const d = utcDay(daysAgo)
  d.setUTCHours(hour, minute, 0, 0)
  return d
}

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('123456', 10)
  const juanjoPasswordHash = await bcrypt.hash('password123', 10)

  // 1. Create Coach
  const coach = await prisma.user.upsert({
    where: { email: 'coach@example.com' },
    update: { passwordHash },
    create: {
      email: 'coach@example.com',
      passwordHash,
      role: 'coach',
      displayName: 'Coach Pro',
    },
  })
  console.log(`Created coach: ${coach.displayName}`)

  const juanjoCoach = await prisma.user.upsert({
    where: { email: 'juanjo@coach.com' },
    update: { passwordHash: juanjoPasswordHash, role: 'coach', displayName: 'Juanjo' },
    create: {
      email: 'juanjo@coach.com',
      passwordHash: juanjoPasswordHash,
      role: 'coach',
      displayName: 'Juanjo',
    },
  })
  console.log(`Created coach: ${juanjoCoach.displayName}`)

  // 2. Create Clients
  const clientSeeds = [
    { email: 'client@example.com', name: 'Alumno 1' },
    { email: 'alumno2@example.com', name: 'Alumno 2' },
    { email: 'alumno3@example.com', name: 'Alumno 3' },
    { email: 'alumno4@example.com', name: 'Alumno 4' },
    { email: 'alumno5@example.com', name: 'Alumno 5' },
  ] as const

  const clients = []
  for (const c of clientSeeds) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash, role: 'client', displayName: c.name },
      create: { email: c.email, passwordHash, role: 'client', displayName: c.name },
    })
    clients.push(u)
  }
  const primaryClient = clients[0]
  console.log(`Created clients: ${clients.length}`)

  // 3. Link Coach and Clients
  for (const c of clients) {
    await prisma.coachClient.upsert({
      where: { coachUserId_clientUserId: { coachUserId: coach.id, clientUserId: c.id } },
      update: { status: 'active' },
      create: { coachUserId: coach.id, clientUserId: c.id, status: 'active' },
    })
  }
  console.log('Linked coach and clients')

  // 4. Create Exercises (coach library)
  const exerciseSeeds = [
    { name: 'Sentadilla Libre', primaryMuscle: 'legs', equipment: 'Barra', difficulty: 'beginner', objective: 'strength' },
    { name: 'Peso Muerto Rumano', primaryMuscle: 'glutes', equipment: 'Barra', difficulty: 'intermediate', objective: 'hypertrophy' },
    { name: 'Prensa 45°', primaryMuscle: 'legs', equipment: 'Máquina', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Curl Femoral', primaryMuscle: 'legs', equipment: 'Máquina', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Extensión de Cuádriceps', primaryMuscle: 'legs', equipment: 'Máquina', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Zancada Caminando', primaryMuscle: 'glutes', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Hip Thrust', primaryMuscle: 'glutes', equipment: 'Barra', difficulty: 'intermediate', objective: 'strength' },
    { name: 'Elevación de Gemelos', primaryMuscle: 'calves', equipment: 'Máquina', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Plancha', primaryMuscle: 'core', equipment: 'Peso corporal', difficulty: 'beginner', objective: 'skill' },
    { name: 'Crunch en polea', primaryMuscle: 'core', equipment: 'Polea', difficulty: 'intermediate', objective: 'hypertrophy' },

    { name: 'Press de Banca', primaryMuscle: 'chest', equipment: 'Barra', difficulty: 'beginner', objective: 'strength' },
    { name: 'Press Inclinado', primaryMuscle: 'chest', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Aperturas', primaryMuscle: 'chest', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Fondos en paralelas', primaryMuscle: 'triceps', equipment: 'Peso corporal', difficulty: 'advanced', objective: 'strength' },
    { name: 'Press Militar', primaryMuscle: 'shoulders', equipment: 'Barra', difficulty: 'intermediate', objective: 'strength' },
    { name: 'Elevaciones laterales', primaryMuscle: 'shoulders', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Face Pull', primaryMuscle: 'shoulders', equipment: 'Polea', difficulty: 'beginner', objective: 'hypertrophy' },

    { name: 'Dominadas', primaryMuscle: 'back', equipment: 'Peso corporal', difficulty: 'advanced', objective: 'strength' },
    { name: 'Jalón al pecho', primaryMuscle: 'back', equipment: 'Polea', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Remo con barra', primaryMuscle: 'back', equipment: 'Barra', difficulty: 'intermediate', objective: 'strength' },
    { name: 'Remo en máquina', primaryMuscle: 'back', equipment: 'Máquina', difficulty: 'beginner', objective: 'hypertrophy' },

    { name: 'Curl bíceps alterno', primaryMuscle: 'biceps', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Curl martillo', primaryMuscle: 'biceps', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Curl en polea', primaryMuscle: 'biceps', equipment: 'Polea', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Extensión tríceps en polea', primaryMuscle: 'triceps', equipment: 'Polea', difficulty: 'beginner', objective: 'hypertrophy' },
    { name: 'Press francés', primaryMuscle: 'triceps', equipment: 'Barra', difficulty: 'intermediate', objective: 'hypertrophy' },
    { name: 'Curl antebrazo', primaryMuscle: 'forearms', equipment: 'Mancuernas', difficulty: 'beginner', objective: 'hypertrophy' },

    { name: 'Caminata en cinta', primaryMuscle: 'full_body', equipment: 'Máquina', difficulty: 'beginner', objective: 'conditioning' },
    { name: 'Bicicleta (zona 2)', primaryMuscle: 'full_body', equipment: 'Máquina', difficulty: 'beginner', objective: 'conditioning' },
  ] as const

  const exercisesByName = new Map<string, { id: string; primaryMuscle: string | null; equipment: string | null }>()
  for (const ex of exerciseSeeds) {
    const saved = await prisma.exercise.upsert({
      where: { coachUserId_name: { coachUserId: coach.id, name: ex.name } },
      update: {
        primaryMuscle: ex.primaryMuscle,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        objective: ex.objective,
        coachUserId: coach.id,
        isSystem: false,
      },
      create: {
        coachUserId: coach.id,
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        objective: ex.objective,
        isSystem: false,
      },
      select: { id: true, primaryMuscle: true, equipment: true },
    })
    exercisesByName.set(ex.name, saved)
  }
  console.log(`Created exercises: ${exercisesByName.size}`)

  // 5. Create a demo Plan + Assignment
  const existingPlan = await prisma.plan.findFirst({
    where: { coachUserId: coach.id, title: 'Recomp Demo (4 semanas)' },
    select: { id: true },
  })

  const plan =
    existingPlan ??
    (await prisma.plan.create({
      data: {
        coachUserId: coach.id,
        title: 'Recomp Demo (4 semanas)',
        goal: 'Recomposición + fuerza',
        notes: 'Indicaciones generales: 8k-10k pasos, proteína alta, dormir 7-8h.',
        weeksCount: 4,
        status: 'published',
      },
      select: { id: true },
    }))

  const existingAssignment = await prisma.planAssignment.findFirst({
    where: { planId: plan.id, clientUserId: primaryClient.id, status: 'active' },
    select: { id: true },
  })

  if (!existingAssignment) {
    await prisma.planAssignment.create({
      data: {
        planId: plan.id,
        clientUserId: primaryClient.id,
        status: 'active',
        startDate: utcDay(21),
      },
      select: { id: true },
    })
  }

  const weeks = []
  for (let w = 1; w <= 4; w++) {
    const week = await prisma.planWeek.upsert({
      where: { planId_weekNumber: { planId: plan.id, weekNumber: w } },
      update: { title: `Semana ${w}`, notes: w === 1 ? 'Prioridad técnica + progresión simple.' : 'Subí 1-2 reps o 2.5kg si sale cómodo.' },
      create: { planId: plan.id, weekNumber: w, title: `Semana ${w}`, notes: w === 1 ? 'Prioridad técnica + progresión simple.' : 'Subí 1-2 reps o 2.5kg si sale cómodo.' },
    })
    weeks.push(week)
  }

  async function ensureTemplate(args: { title: string; description: string; sortOrder: number; type?: string }) {
    const existing = await prisma.workoutTemplate.findFirst({ where: { coachUserId: coach.id, title: args.title }, select: { id: true } })
    if (existing) return existing
    return prisma.workoutTemplate.create({
      data: { coachUserId: coach.id, title: args.title, description: args.description, sortOrder: args.sortOrder, type: args.type ?? 'strength' },
      select: { id: true },
    })
  }

  async function ensureBlock(args: { templateId: string; type: string; label: string; sortOrder: number; intervalType?: string; workSeconds?: number; restSeconds?: number; rounds?: number; totalDurationSeconds?: number; targetMinutes?: number; targetZone?: string }) {
    const existing = await prisma.workoutBlock.findFirst({ where: { workoutTemplateId: args.templateId, type: args.type, sortOrder: args.sortOrder }, select: { id: true } })
    if (existing) return existing
    return prisma.workoutBlock.create({
      data: {
        workoutTemplateId: args.templateId,
        type: args.type,
        label: args.label,
        sortOrder: args.sortOrder,
        intervalType: args.intervalType ?? null,
        workSeconds: args.workSeconds ?? null,
        restSeconds: args.restSeconds ?? null,
        rounds: args.rounds ?? null,
        totalDurationSeconds: args.totalDurationSeconds ?? null,
        targetMinutes: args.targetMinutes ?? null,
        targetZone: args.targetZone ?? null,
      },
      select: { id: true },
    })
  }

  async function ensureWE(args: { templateId: string; blockId: string; exerciseName: string; sortOrder: number; targetSets?: number; targetReps?: string; restSeconds?: number; intensityType?: string; intensityTarget?: number; durationSeconds?: number; notes?: string }) {
    const ex = exercisesByName.get(args.exerciseName)
    if (!ex) throw new Error(`Missing exercise seed: ${args.exerciseName}`)
    const existing = await prisma.workoutExercise.findFirst({ where: { workoutTemplateId: args.templateId, exerciseId: ex.id }, select: { id: true } })
    if (existing) return existing
    return prisma.workoutExercise.create({
      data: {
        workoutTemplateId: args.templateId,
        workoutBlockId: args.blockId,
        exerciseId: ex.id,
        sortOrder: args.sortOrder,
        targetSets: args.targetSets ?? null,
        targetReps: args.targetReps ?? null,
        restSeconds: args.restSeconds ?? null,
        intensityType: args.intensityType ?? null,
        intensityTarget: args.intensityTarget ?? null,
        durationSeconds: args.durationSeconds ?? null,
        notes: args.notes ?? null,
      },
      select: { id: true },
    })
  }

  const tLower = await ensureTemplate({ title: 'Día A (Lower)', description: 'Piernas + core', sortOrder: 0, type: 'strength' })
  const tUpper = await ensureTemplate({ title: 'Día B (Upper)', description: 'Empuje + tirón', sortOrder: 1, type: 'strength' })
  const tCond = await ensureTemplate({ title: 'Día C (Conditioning)', description: 'Cardio + core', sortOrder: 2, type: 'cardio' })

  const lowerWarm = await ensureBlock({ templateId: tLower.id, type: 'warmup', label: 'Entrada en calor', sortOrder: 0, targetMinutes: 8 })
  const lowerStr = await ensureBlock({ templateId: tLower.id, type: 'strength', label: 'Fuerza', sortOrder: 1 })
  const lowerInt = await ensureBlock({ templateId: tLower.id, type: 'intervals', label: 'Finisher', sortOrder: 2, intervalType: 'emom', rounds: 8 })
  const lowerCool = await ensureBlock({ templateId: tLower.id, type: 'cooldown', label: 'Vuelta a la calma', sortOrder: 3, targetMinutes: 5 })

  const upperWarm = await ensureBlock({ templateId: tUpper.id, type: 'warmup', label: 'Entrada en calor', sortOrder: 0, targetMinutes: 8 })
  const upperStr = await ensureBlock({ templateId: tUpper.id, type: 'strength', label: 'Fuerza', sortOrder: 1 })
  const upperCool = await ensureBlock({ templateId: tUpper.id, type: 'cooldown', label: 'Vuelta a la calma', sortOrder: 2, targetMinutes: 5 })

  const condCardio = await ensureBlock({ templateId: tCond.id, type: 'cardio', label: 'Zona 2', sortOrder: 0, targetMinutes: 25, targetZone: 'Zona 2' })
  const condCore = await ensureBlock({ templateId: tCond.id, type: 'strength', label: 'Core', sortOrder: 1 })

  await ensureWE({ templateId: tLower.id, blockId: lowerWarm.id, exerciseName: 'Caminata en cinta', sortOrder: 0, durationSeconds: 300, notes: 'Ritmo suave' })
  await ensureWE({ templateId: tLower.id, blockId: lowerStr.id, exerciseName: 'Sentadilla Libre', sortOrder: 0, targetSets: 4, targetReps: '6-8', restSeconds: 120, intensityType: 'rpe', intensityTarget: 8, notes: 'Foco técnica' })
  await ensureWE({ templateId: tLower.id, blockId: lowerStr.id, exerciseName: 'Peso Muerto Rumano', sortOrder: 1, targetSets: 3, targetReps: '8-10', restSeconds: 120, intensityType: 'rpe', intensityTarget: 8 })
  await ensureWE({ templateId: tLower.id, blockId: lowerStr.id, exerciseName: 'Prensa 45°', sortOrder: 2, targetSets: 3, targetReps: '10-12', restSeconds: 90, intensityType: 'rpe', intensityTarget: 8 })
  await ensureWE({ templateId: tLower.id, blockId: lowerStr.id, exerciseName: 'Curl Femoral', sortOrder: 3, targetSets: 3, targetReps: '10-12', restSeconds: 75 })
  await ensureWE({ templateId: tLower.id, blockId: lowerStr.id, exerciseName: 'Elevación de Gemelos', sortOrder: 4, targetSets: 3, targetReps: '12-15', restSeconds: 60 })
  await ensureWE({ templateId: tLower.id, blockId: lowerInt.id, exerciseName: 'Plancha', sortOrder: 0, durationSeconds: 40, notes: '40s trabajo' })
  await ensureWE({ templateId: tLower.id, blockId: lowerCool.id, exerciseName: 'Bicicleta (zona 2)', sortOrder: 0, durationSeconds: 180, notes: 'Suave' })

  await ensureWE({ templateId: tUpper.id, blockId: upperWarm.id, exerciseName: 'Caminata en cinta', sortOrder: 0, durationSeconds: 240 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Press de Banca', sortOrder: 0, targetSets: 4, targetReps: '5-7', restSeconds: 150, intensityType: 'rpe', intensityTarget: 8 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Remo con barra', sortOrder: 1, targetSets: 4, targetReps: '6-8', restSeconds: 150, intensityType: 'rpe', intensityTarget: 8 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Press Militar', sortOrder: 2, targetSets: 3, targetReps: '6-8', restSeconds: 120 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Jalón al pecho', sortOrder: 3, targetSets: 3, targetReps: '10-12', restSeconds: 90 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Elevaciones laterales', sortOrder: 4, targetSets: 3, targetReps: '12-15', restSeconds: 60 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Extensión tríceps en polea', sortOrder: 5, targetSets: 3, targetReps: '10-12', restSeconds: 60 })
  await ensureWE({ templateId: tUpper.id, blockId: upperStr.id, exerciseName: 'Curl bíceps alterno', sortOrder: 6, targetSets: 3, targetReps: '10-12', restSeconds: 60 })
  await ensureWE({ templateId: tUpper.id, blockId: upperCool.id, exerciseName: 'Bicicleta (zona 2)', sortOrder: 0, durationSeconds: 180, notes: 'Soltar' })

  await ensureWE({ templateId: tCond.id, blockId: condCardio.id, exerciseName: 'Bicicleta (zona 2)', sortOrder: 0, durationSeconds: 1500 })
  await ensureWE({ templateId: tCond.id, blockId: condCore.id, exerciseName: 'Crunch en polea', sortOrder: 0, targetSets: 3, targetReps: '12-15', restSeconds: 60 })
  await ensureWE({ templateId: tCond.id, blockId: condCore.id, exerciseName: 'Plancha', sortOrder: 1, durationSeconds: 45, notes: '45s' })

  const templates = [tLower, tUpper, tCond]
  for (let i = 0; i < templates.length; i++) {
    await prisma.planWorkout.upsert({
      where: { planId_workoutTemplateId: { planId: plan.id, workoutTemplateId: templates[i].id } },
      update: {},
      create: { planId: plan.id, workoutTemplateId: templates[i].id, sortOrder: i },
    })
  }

  for (const w of weeks) {
    const order = [tLower, tUpper, tCond]
    for (let i = 0; i < order.length; i++) {
      const existing = await prisma.planWeekWorkout.findFirst({
        where: { planWeekId: w.id, workoutTemplateId: order[i].id },
        select: { id: true },
      })
      if (!existing) {
        await prisma.planWeekWorkout.create({
          data: {
            planWeekId: w.id,
            workoutTemplateId: order[i].id,
            sortOrder: i,
            progressionNote: i === 0 ? 'Subí 2.5kg si completás el rango de reps.' : null,
          },
        })
      }
    }
  }

  const weekLinks = await prisma.planWeekWorkout.findMany({
    where: { planWeekId: { in: weeks.map((w) => w.id) } },
    select: { id: true, planWeekId: true, workoutTemplateId: true },
  })
  const firstWeekId = weeks[0].id
  const linkByTemplate = new Map<string, string>()
  for (const l of weekLinks) {
    if (l.planWeekId === firstWeekId) linkByTemplate.set(l.workoutTemplateId, l.id)
  }

  // 6. Favorites for coach
  const favNames = ['Sentadilla Libre', 'Press de Banca', 'Remo con barra', 'Hip Thrust', 'Jalón al pecho'] as const
  for (const n of favNames) {
    const ex = exercisesByName.get(n)
    if (!ex) continue
    await prisma.coachExerciseFavorite.upsert({
      where: { coachUserId_exerciseId: { coachUserId: coach.id, exerciseId: ex.id } },
      update: {},
      create: { coachUserId: coach.id, exerciseId: ex.id },
    })
  }

  // 7. Health metrics, goals, body metrics, food logs
  await prisma.workoutSession.deleteMany({ where: { clientUserId: primaryClient.id } })
  await prisma.dailyHealthEntry.deleteMany({ where: { clientUserId: primaryClient.id } })
  await prisma.bodyMetricEntry.deleteMany({ where: { clientUserId: primaryClient.id } })
  await prisma.healthGoal.deleteMany({ where: { clientUserId: primaryClient.id } })
  await prisma.foodLogEntry.deleteMany({ where: { clientUserId: primaryClient.id } })

  for (let d = 0; d < 21; d++) {
    const day = utcDay(d)
    await prisma.dailyHealthEntry.upsert({
      where: { clientUserId_day: { clientUserId: primaryClient.id, day } },
      update: {
        steps: 6500 + ((d * 431) % 5200),
        sleepMinutes: 380 + ((d * 17) % 140),
        sportType: d % 3 === 0 ? 'gym' : 'walk',
        sportMinutes: d % 3 === 0 ? 55 : 35,
        notes: d % 7 === 0 ? 'Semana con buen descanso.' : null,
        source: 'manual',
      },
      create: {
        clientUserId: primaryClient.id,
        day,
        steps: 6500 + ((d * 431) % 5200),
        sleepMinutes: 380 + ((d * 17) % 140),
        sportType: d % 3 === 0 ? 'gym' : 'walk',
        sportMinutes: d % 3 === 0 ? 55 : 35,
        notes: d % 7 === 0 ? 'Semana con buen descanso.' : null,
        source: 'manual',
      },
    })
  }

  for (let w = 0; w < 10; w++) {
    await prisma.bodyMetricEntry.create({
      data: {
        clientUserId: primaryClient.id,
        measuredAt: utcDay(w * 7),
        weightKg: 82 - w * 0.3,
        waistCm: 86 - w * 0.2,
        hipsCm: 98 - w * 0.1,
        shareWithCoach: true,
      },
    })
  }

  const today = utcDay(0)
  await prisma.healthGoal.createMany({
    data: [
      { clientUserId: primaryClient.id, kind: 'steps', targetInt: 9000, unit: 'steps', period: 'daily', startDate: today, shareWithCoach: true },
      { clientUserId: primaryClient.id, kind: 'weight', targetNumber: 78, unit: 'kg', period: 'weekly', startDate: today, shareWithCoach: true },
      { clientUserId: primaryClient.id, kind: 'sleep', targetInt: 450, unit: 'minutes', period: 'daily', startDate: today, shareWithCoach: true },
    ],
  })

  for (let d = 0; d < 8; d++) {
    const entries = [
      { hour: 8, mealType: 'desayuno', text: 'Yogur + fruta + café', quality: 'good', macroTags: ['protein', 'carbs'] },
      { hour: 13, mealType: 'almuerzo', text: 'Pollo + arroz + ensalada', quality: 'good', macroTags: ['protein'] },
      { hour: 21, mealType: 'cena', text: 'Carne magra + verduras', quality: 'good', macroTags: ['protein', 'fiber'] },
    ] as const
    for (const [i, e] of entries.entries()) {
      const loggedAt = utcDateTime(d, e.hour, 10)
      const food = await prisma.foodLogEntry.create({
        data: {
          clientUserId: primaryClient.id,
          loggedAt,
          text: e.text,
          source: 'manual',
          mealType: e.mealType,
          quality: e.quality,
          macroTags: [...e.macroTags],
        },
        select: { id: true },
      })
      if (d % 3 === 0 && i === 1) {
        await prisma.foodCoachComment.create({
          data: { foodId: food.id, coachUserId: coach.id, text: 'Buen plato. Sumá 1 fruta post entrenamiento.' },
        })
      }
    }
  }

  // 8. Workout history (sessions + sets)
  const sessionTemplates = [tLower.id, tUpper.id, tCond.id]
  for (let i = 0; i < 9; i++) {
    const templateId = sessionTemplates[i % sessionTemplates.length]
    const performedAt = utcDateTime(20 - i * 2, 19, 0)
    const completedAt = new Date(performedAt.getTime() + 65 * 60 * 1000)
    const planWeekWorkoutId = linkByTemplate.get(templateId) ?? null

    const session = await prisma.workoutSession.create({
      data: {
        clientUserId: primaryClient.id,
        workoutTemplateId: templateId,
        planWeekWorkoutId,
        performedAt,
        completedAt,
        status: 'completed',
        energyRating: 3 + (i % 3),
        sessionNotes: i % 2 === 0 ? 'Buen ritmo. Me sentí sólido.' : 'Un poco cansado pero cumplí.',
      },
      select: { id: true },
    })

    const workoutExercises = await prisma.workoutExercise.findMany({
      where: { workoutTemplateId: templateId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, exerciseId: true, sortOrder: true, targetSets: true, durationSeconds: true, targetReps: true },
    })

    for (const we of workoutExercises) {
      const wse = await prisma.workoutSessionExercise.create({
        data: {
          workoutSessionId: session.id,
          workoutExerciseId: we.id,
          plannedExerciseId: we.exerciseId,
          performedExerciseId: we.exerciseId,
          sortOrder: we.sortOrder,
        },
        select: { id: true },
      })

      const setsCount = we.durationSeconds ? 1 : (we.targetSets ?? 3)
      for (let s = 1; s <= setsCount; s++) {
        const baseWeight = 40 + (i % 3) * 5 + we.sortOrder * 2
        await prisma.workoutSet.create({
          data: {
            workoutSessionExerciseId: wse.id,
            setNumber: s,
            reps: we.durationSeconds ? null : 8 + ((s + i) % 3),
            durationSeconds: we.durationSeconds ? we.durationSeconds : null,
            weight: we.durationSeconds ? null : baseWeight + s * 2,
            rpe: we.durationSeconds ? null : 7 + (s % 2),
          },
        })
      }
    }

    if (i % 3 === 0) {
      await prisma.sessionComment.create({
        data: { sessionId: session.id, authorUserId: primaryClient.id, text: 'Me gustó este entreno.' },
      })
      await prisma.sessionComment.create({
        data: { sessionId: session.id, authorUserId: coach.id, text: 'Excelente. La semana que viene subimos un poquito la carga.' },
      })
    }
  }

  const inProgressTemplateId = tUpper.id
  const inProgress = await prisma.workoutSession.create({
    data: {
      clientUserId: primaryClient.id,
      workoutTemplateId: inProgressTemplateId,
      planWeekWorkoutId: linkByTemplate.get(inProgressTemplateId) ?? null,
      performedAt: utcDateTime(0, 18, 30),
      status: 'in_progress',
      energyRating: 4,
      sessionNotes: 'Arranqué tarde. Voy lento.',
    },
    select: { id: true },
  })
  const inProgressWEs = await prisma.workoutExercise.findMany({
    where: { workoutTemplateId: inProgressTemplateId },
    orderBy: { sortOrder: 'asc' },
    take: 3,
    select: { id: true, exerciseId: true, sortOrder: true },
  })
  for (const we of inProgressWEs) {
    await prisma.workoutSessionExercise.create({
      data: {
        workoutSessionId: inProgress.id,
        workoutExerciseId: we.id,
        plannedExerciseId: we.exerciseId,
        performedExerciseId: we.exerciseId,
        sortOrder: we.sortOrder,
      },
    })
  }

  console.log('Created robust demo dataset')

  // ────────────────────────────────────────────────────────────────
  // 9. Gym user, groups, and classes
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding gym data ---')

  const gymPass = await bcrypt.hash('123456', 10)

  const gymUser = await prisma.user.upsert({
    where: { email: 'gym@example.com' },
    update: { passwordHash: gymPass, role: 'gym', displayName: 'CrossFit Box Pro', emailVerified: true },
    create: { email: 'gym@example.com', passwordHash: gymPass, role: 'gym', displayName: 'CrossFit Box Pro', emailVerified: true },
  })
  console.log(`  Gym: ${gymUser.displayName}`)

  // Gym clients
  const gymClientSeeds = [
    { email: 'gymclient1@example.com', name: 'Pedro Gómez' },
    { email: 'gymclient2@example.com', name: 'María López' },
    { email: 'gymclient3@example.com', name: 'Carlos Díaz' },
    { email: 'gymclient4@example.com', name: 'Ana Ruiz' },
    { email: 'gymclient5@example.com', name: 'Luis Torres' },
    { email: 'gymclient6@example.com', name: 'Sofía Vega' },
  ]

  const gymClients = []
  for (const c of gymClientSeeds) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash: gymPass, role: 'client', displayName: c.name, emailVerified: true },
      create: { email: c.email, passwordHash: gymPass, role: 'client', displayName: c.name, emailVerified: true },
    })
    gymClients.push(u)
    await prisma.coachClient.upsert({
      where: { coachUserId_clientUserId: { coachUserId: gymUser.id, clientUserId: u.id } },
      update: { status: 'active' },
      create: { coachUserId: gymUser.id, clientUserId: u.id, status: 'active' },
    })
  }
  console.log(`  Gym clients: ${gymClients.length}`)

  // Groups
  const groupBeginner = await prisma.coachGroup.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Principiantes' } },
    update: { level: 'beginner' },
    create: { coachUserId: gymUser.id, name: 'Principiantes', level: 'beginner' },
  })
  const groupIntermediate = await prisma.coachGroup.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Intermedios' } },
    update: { level: 'intermediate' },
    create: { coachUserId: gymUser.id, name: 'Intermedios', level: 'intermediate' },
  })
  const groupAdvanced = await prisma.coachGroup.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Avanzados' } },
    update: { level: 'advanced' },
    create: { coachUserId: gymUser.id, name: 'Avanzados', level: 'advanced' },
  })
  console.log(`  Groups: 3`)

  // Assign clients to groups
  for (const [i, c] of gymClients.entries()) {
    const groupId = i < 2 ? groupBeginner.id : i < 4 ? groupIntermediate.id : groupAdvanced.id
    await prisma.coachGroupMember.upsert({
      where: { groupId_clientUserId: { groupId, clientUserId: c.id } },
      update: {},
      create: { groupId, clientUserId: c.id },
    })
  }
  console.log(`  Group members assigned`)

  // Create gym workout templates (simpler, no blocks - just exercises directly for gym classes)
  const gymTemplateSeed1 = await prisma.workoutTemplate.upsert({
    where: { id: 'gym-wod-1' },
    update: {},
    create: {
      id: 'gym-wod-1',
      coachUserId: gymUser.id,
      title: 'WOD CrossFit',
      description: 'Entrenamiento del día - alta intensidad',
      type: 'strength',
      sortOrder: 0,
    },
  })
  const gymTemplateSeed2 = await prisma.workoutTemplate.upsert({
    where: { id: 'gym-wod-2' },
    update: {},
    create: {
      id: 'gym-wod-2',
      coachUserId: gymUser.id,
      title: 'Funcional HIIT',
      description: 'Intervalos de alta intensidad',
      type: 'cardio',
      sortOrder: 1,
    },
  })

  // Ensure exercises exist for gym (reuse from seed or create)
  const gymEx1 = await prisma.exercise.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Burpees' } },
    update: { primaryMuscle: 'full_body', equipment: 'Peso corporal', difficulty: 'intermediate', objective: 'conditioning' },
    create: { coachUserId: gymUser.id, name: 'Burpees', primaryMuscle: 'full_body', equipment: 'Peso corporal', difficulty: 'intermediate', objective: 'conditioning', isSystem: false },
  })
  const gymEx2 = await prisma.exercise.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Kettlebell Swing' } },
    update: { primaryMuscle: 'glutes', equipment: 'Kettlebell', difficulty: 'beginner', objective: 'conditioning' },
    create: { coachUserId: gymUser.id, name: 'Kettlebell Swing', primaryMuscle: 'glutes', equipment: 'Kettlebell', difficulty: 'beginner', objective: 'conditioning', isSystem: false },
  })
  const gymEx3 = await prisma.exercise.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Box Jump' } },
    update: { primaryMuscle: 'legs', equipment: 'Cajón', difficulty: 'intermediate', objective: 'strength' },
    create: { coachUserId: gymUser.id, name: 'Box Jump', primaryMuscle: 'legs', equipment: 'Cajón', difficulty: 'intermediate', objective: 'strength', isSystem: false },
  })
  const gymEx4 = await prisma.exercise.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Wall Ball' } },
    update: { primaryMuscle: 'full_body', equipment: 'Pelota', difficulty: 'beginner', objective: 'conditioning' },
    create: { coachUserId: gymUser.id, name: 'Wall Ball', primaryMuscle: 'full_body', equipment: 'Pelota', difficulty: 'beginner', objective: 'conditioning', isSystem: false },
  })
  const gymEx5 = await prisma.exercise.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Thruster' } },
    update: { primaryMuscle: 'full_body', equipment: 'Barra', difficulty: 'advanced', objective: 'strength' },
    create: { coachUserId: gymUser.id, name: 'Thruster', primaryMuscle: 'full_body', equipment: 'Barra', difficulty: 'advanced', objective: 'strength', isSystem: false },
  })
  const gymEx6 = await prisma.exercise.upsert({
    where: { coachUserId_name: { coachUserId: gymUser.id, name: 'Double Under' } },
    update: { primaryMuscle: 'full_body', equipment: 'Soga', difficulty: 'intermediate', objective: 'skill' },
    create: { coachUserId: gymUser.id, name: 'Double Under', primaryMuscle: 'full_body', equipment: 'Soga', difficulty: 'intermediate', objective: 'skill', isSystem: false },
  })

  // Add exercises to gym WOD template
  const block1 = await prisma.workoutBlock.upsert({
    where: { id: 'gym-block-1' },
    update: {},
    create: { id: 'gym-block-1', workoutTemplateId: gymTemplateSeed1.id, type: 'warmup', label: 'Entrada en calor', sortOrder: 0, targetMinutes: 8 },
  })
  const block2 = await prisma.workoutBlock.upsert({
    where: { id: 'gym-block-2' },
    update: {},
    create: { id: 'gym-block-2', workoutTemplateId: gymTemplateSeed1.id, type: 'strength', label: 'WOD', sortOrder: 1 },
  })
  const block3 = await prisma.workoutBlock.upsert({
    where: { id: 'gym-block-3' },
    update: {},
    create: { id: 'gym-block-3', workoutTemplateId: gymTemplateSeed1.id, type: 'cooldown', label: 'Vuelta a la calma', sortOrder: 2, targetMinutes: 5 },
  })

  await prisma.workoutExercise.upsert({
    where: { id: 'gym-we-1' },
    update: {},
    create: { id: 'gym-we-1', workoutTemplateId: gymTemplateSeed1.id, workoutBlockId: block1.id, exerciseId: gymEx1.id, sortOrder: 0, durationSeconds: 120, notes: 'Ritmo suave' },
  })
  await prisma.workoutExercise.upsert({
    where: { id: 'gym-we-2' },
    update: {},
    create: { id: 'gym-we-2', workoutTemplateId: gymTemplateSeed1.id, workoutBlockId: block2.id, exerciseId: gymEx2.id, sortOrder: 0, targetSets: 3, targetReps: '15', restSeconds: 60 },
  })
  await prisma.workoutExercise.upsert({
    where: { id: 'gym-we-3' },
    update: {},
    create: { id: 'gym-we-3', workoutTemplateId: gymTemplateSeed1.id, workoutBlockId: block2.id, exerciseId: gymEx3.id, sortOrder: 1, targetSets: 3, targetReps: '10', restSeconds: 60 },
  })
  await prisma.workoutExercise.upsert({
    where: { id: 'gym-we-4' },
    update: {},
    create: { id: 'gym-we-4', workoutTemplateId: gymTemplateSeed1.id, workoutBlockId: block2.id, exerciseId: gymEx4.id, sortOrder: 2, targetSets: 3, targetReps: '12', restSeconds: 60 },
  })
  await prisma.workoutExercise.upsert({
    where: { id: 'gym-we-5' },
    update: {},
    create: { id: 'gym-we-5', workoutTemplateId: gymTemplateSeed1.id, workoutBlockId: block2.id, exerciseId: gymEx5.id, sortOrder: 3, targetSets: 3, targetReps: '8', restSeconds: 90, intensityType: 'rpe', intensityTarget: 8 },
  })
  await prisma.workoutExercise.upsert({
    where: { id: 'gym-we-6' },
    update: {},
    create: { id: 'gym-we-6', workoutTemplateId: gymTemplateSeed1.id, workoutBlockId: block3.id, exerciseId: gymEx6.id, sortOrder: 0, durationSeconds: 180, notes: 'Soltar, técnica' },
  })

  console.log(`  Gym workout templates with exercises created`)

  // Gym classes
  const now = new Date()
  const class1 = await prisma.gymClass.upsert({
    where: { id: 'gym-class-1' },
    update: {},
    create: {
      id: 'gym-class-1',
      gymUserId: gymUser.id,
      name: 'CrossFit AM',
      description: 'Clase de la mañana - todos los niveles',
      workoutTemplateId: gymTemplateSeed1.id,
      groupId: groupIntermediate.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
      durationMinutes: 60,
      status: 'scheduled',
    },
  })
  const class2 = await prisma.gymClass.upsert({
    where: { id: 'gym-class-2' },
    update: {},
    create: {
      id: 'gym-class-2',
      gymUserId: gymUser.id,
      name: 'Funcional PM',
      description: 'Clase de la tarde - principiantes',
      workoutTemplateId: gymTemplateSeed1.id,
      groupId: groupBeginner.id,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0),
      durationMinutes: 45,
      status: 'scheduled',
    },
  })
  console.log(`  Gym classes: 2 scheduled`)

  // ────────────────────────────────────────────────────────────────
  // 10. Solo client (no coach) + public plan for exploring
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding solo client data ---')

  const soloClient = await prisma.user.upsert({
    where: { email: 'solo@example.com' },
    update: { passwordHash: gymPass, role: 'client', displayName: 'Jorge Solo', emailVerified: true },
    create: { email: 'solo@example.com', passwordHash: gymPass, role: 'client', displayName: 'Jorge Solo', emailVerified: true },
  })
  console.log(`  Solo client: ${soloClient.displayName} (sin coach)`)

  // Create a public self-guided plan
  const publicPlan = await prisma.plan.upsert({
    where: { id: 'public-plan-1' },
    update: { isPublic: true, planType: 'self_guided', status: 'published' },
    create: {
      id: 'public-plan-1',
      coachUserId: gymUser.id,
      title: 'Plan Full Body (Autoguiado)',
      goal: 'Mejorar condición física general',
      notes: 'Plan de 4 semanas para hacer a tu ritmo. 3 entrenos por semana.',
      weeksCount: 4,
      periodDays: 7,
      status: 'published',
      planType: 'self_guided',
      isPublic: true,
    },
  })

  // Assign workouts to the public plan
  for (let w = 1; w <= 4; w++) {
    const pWeek = await prisma.planWeek.upsert({
      where: { planId_weekNumber: { planId: publicPlan.id, weekNumber: w } },
      update: {},
      create: { planId: publicPlan.id, weekNumber: w, title: `Semana ${w}` },
    })
    const tLower = await prisma.workoutTemplate.findFirst({ where: { coachUserId: '3ea05db0-6372-4532-9418-d5e31f6ffa67', title: 'Día A (Lower)' }, select: { id: true } })
    const tUpper = await prisma.workoutTemplate.findFirst({ where: { coachUserId: '3ea05db0-6372-4532-9418-d5e31f6ffa67', title: 'Día B (Upper)' }, select: { id: true } })
    const tCond = await prisma.workoutTemplate.findFirst({ where: { coachUserId: '3ea05db0-6372-4532-9418-d5e31f6ffa67', title: 'Día C (Conditioning)' }, select: { id: true } })
    const templates = [tLower, tUpper, tCond].filter(Boolean)
    for (let d = 0; d < templates.length; d++) {
      await prisma.planWeekWorkout.upsert({
        where: { id: `public-pww-${w}-${d}` },
        update: {},
        create: { id: `public-pww-${w}-${d}`, planWeekId: pWeek.id, workoutTemplateId: templates[d]!.id, sortOrder: d },
      })
    }
  }
  console.log(`  Public self-guided plan: ${publicPlan.title}`)

  console.log('\nSeed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
