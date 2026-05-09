import { prisma } from "@/lib/prisma";

export async function verifyPlanOwnership(planId: string, coachUserId: string) {
  return prisma.plan.findFirst({ where: { id: planId, coachUserId } });
}

export async function verifyWorkoutTemplateOwnership(workoutTemplateId: string, coachUserId: string) {
  return prisma.workoutTemplate.findFirst({ where: { id: workoutTemplateId, coachUserId } });
}

export async function verifyBlockOwnership(blockId: string, coachUserId: string) {
  return prisma.workoutBlock.findFirst({
    where: { id: blockId, workoutTemplate: { coachUserId } },
  });
}

export async function verifyWorkoutExerciseOwnership(weId: string, coachUserId: string) {
  return prisma.workoutExercise.findFirst({
    where: { id: weId, workoutTemplate: { coachUserId } },
  });
}

export async function verifySessionOwnership(sessionId: string, clientUserId: string) {
  return prisma.workoutSession.findFirst({ where: { id: sessionId, clientUserId } });
}

export async function verifyChatThread(coachUserId: string, clientUserId: string) {
  return prisma.chatThread.findFirst({ where: { coachUserId, clientUserId } });
}

export async function verifyCoachClientRelation(coachUserId: string, clientUserId: string) {
  return prisma.coachClient.findFirst({ where: { coachUserId, clientUserId, status: "active" } });
}