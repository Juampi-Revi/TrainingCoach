import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('123456', 10)

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

  // 2. Create Client
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: { passwordHash },
    create: {
      email: 'client@example.com',
      passwordHash,
      role: 'client',
      displayName: 'Alumno 1',
    },
  })
  console.log(`Created client: ${client.displayName}`)

  // 3. Link Coach and Client
  await prisma.coachClient.upsert({
    where: { coachUserId_clientUserId: { coachUserId: coach.id, clientUserId: client.id } },
    update: {},
    create: {
      coachUserId: coach.id,
      clientUserId: client.id,
      status: 'active',
    },
  })
  console.log('Linked coach and client')

  // 4. Create an Exercise
  const exercise = await prisma.exercise.upsert({
    where: {
      coachUserId_name: {
        coachUserId: coach.id,
        name: 'Sentadilla Libre',
      },
    },
    update: {},
    create: {
      coachUserId: coach.id,
      name: 'Sentadilla Libre',
      primaryMuscle: 'Piernas',
      equipment: 'Barra',
    },
  })
  console.log(`Created exercise: ${exercise.name}`)

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
    where: { planId: plan.id, clientUserId: client.id, status: 'active' },
    select: { id: true },
  })

  if (!existingAssignment) {
    await prisma.planAssignment.create({
      data: {
        planId: plan.id,
        clientUserId: client.id,
        status: 'active',
        startDate: new Date(),
      },
      select: { id: true },
    })
  }

  const planWeek1 = await prisma.planWeek.upsert({
    where: { planId_weekNumber: { planId: plan.id, weekNumber: 1 } },
    update: { title: 'Semana 1', notes: 'Prioridad técnica + progresión simple.' },
    create: { planId: plan.id, weekNumber: 1, title: 'Semana 1', notes: 'Prioridad técnica + progresión simple.' },
  })

  const existingTemplate = await prisma.workoutTemplate.findFirst({
    where: { coachUserId: coach.id, title: 'Día A (Lower)' },
    select: { id: true },
  })

  const template =
    existingTemplate ??
    (await prisma.workoutTemplate.create({
      data: {
        coachUserId: coach.id,
        title: 'Día A (Lower)',
        description: 'Piernas + core',
        sortOrder: 0,
      },
      select: { id: true },
    }))

  const existingWeekLink = await prisma.planWeekWorkout.findFirst({
    where: { planWeekId: planWeek1.id, workoutTemplateId: template.id },
    select: { id: true },
  })

  await prisma.planWorkout.upsert({
    where: { planId_workoutTemplateId: { planId: plan.id, workoutTemplateId: template.id } },
    update: {},
    create: { planId: plan.id, workoutTemplateId: template.id, sortOrder: 0 },
  })

  if (!existingWeekLink) {
    await prisma.planWeekWorkout.create({
      data: {
        planWeekId: planWeek1.id,
        workoutTemplateId: template.id,
        sortOrder: 0,
      },
      select: { id: true },
    })
  }

  const existingWorkoutExercise = await prisma.workoutExercise.findFirst({
    where: { workoutTemplateId: template.id, exerciseId: exercise.id },
    select: { id: true },
  })

  if (!existingWorkoutExercise) {
    await prisma.workoutExercise.create({
      data: {
        workoutTemplateId: template.id,
        exerciseId: exercise.id,
        sortOrder: 0,
        targetSets: 4,
        targetReps: '6-8',
        restSeconds: 120,
        notes: 'RPE 7-8',
      },
      select: { id: true },
    })
  }

  console.log('Created demo plan and assignment')

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
