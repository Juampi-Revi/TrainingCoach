import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, err, withHandler } from "@/lib/api-response";
import { workoutExercisePatchSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ workoutTemplateId: string; weId: string }> };

async function verifyOwner(workoutTemplateId: string, weId: string, coachUserId: string) {
  return prisma.workoutExercise.findFirst({
    where: { id: weId, workoutTemplateId, workoutTemplate: { coachUserId } },
    select: { id: true, workoutBlockId: true, supersetGroup: true },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    const we = await verifyOwner(workoutTemplateId, weId, auth.user.sub);
    if (!we) return forbidden();

    const raw = await req.json().catch(() => ({}));

    const parsed = workoutExercisePatchSchema.safeParse(raw);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const body = parsed.data;

    // If moving to a different block, validate the new block exists
    if (body.workoutBlockId !== undefined && body.workoutBlockId !== we.workoutBlockId) {
      const block = await prisma.workoutBlock.findFirst({
        where: { id: body.workoutBlockId, workoutTemplateId },
      });
      if (!block) return err("Target block not found", 404);

      // If sortOrder not provided, place at the end of the new block
      if (body.sortOrder === undefined) {
        const lastInBlock = await prisma.workoutExercise.findFirst({
          where: { workoutBlockId: body.workoutBlockId },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        body.sortOrder = (lastInBlock?.sortOrder ?? -1) + 1;
      }
    }

    const finalBlockId = body.workoutBlockId ?? we.workoutBlockId;
    const finalSupersetGroup =
      body.supersetGroup !== undefined ? body.supersetGroup : we.supersetGroup;

    if (body.supersetGroup !== undefined && body.supersetGroup !== we.supersetGroup) {
      if (body.supersetGroup) {
        const source = await prisma.workoutExercise.findFirst({
          where: {
            workoutTemplateId,
            workoutBlockId: finalBlockId,
            supersetGroup: body.supersetGroup,
            id: { not: weId },
          },
          select: {
            groupNote: true,
            groupIsExtra: true,
            groupRoleLabel: true,
            groupEffortLabel: true,
            groupExecutionLabel: true,
          },
        });
        if (body.groupNote === undefined) body.groupNote = source?.groupNote ?? null;
        if (body.groupIsExtra === undefined) body.groupIsExtra = source?.groupIsExtra ?? false;
        if (body.groupRoleLabel === undefined) body.groupRoleLabel = (source?.groupRoleLabel ?? null) as unknown as typeof body.groupRoleLabel;
        if (body.groupEffortLabel === undefined) body.groupEffortLabel = (source?.groupEffortLabel ?? null) as unknown as typeof body.groupEffortLabel;
        if (body.groupExecutionLabel === undefined) body.groupExecutionLabel = (source?.groupExecutionLabel ?? null) as unknown as typeof body.groupExecutionLabel;
      } else {
        if (body.groupNote === undefined) body.groupNote = null;
        if (body.groupIsExtra === undefined) body.groupIsExtra = false;
        if (body.groupRoleLabel === undefined) body.groupRoleLabel = null;
        if (body.groupEffortLabel === undefined) body.groupEffortLabel = null;
        if (body.groupExecutionLabel === undefined) body.groupExecutionLabel = null;
      }
    }

    const groupMetaPatch =
      finalSupersetGroup !== null &&
      (body.groupNote !== undefined ||
        body.groupIsExtra !== undefined ||
        body.groupRoleLabel !== undefined ||
        body.groupEffortLabel !== undefined ||
        body.groupExecutionLabel !== undefined);

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.workoutExercise.update({
        where: { id: weId },
        data: {
          ...(body.workoutBlockId !== undefined && { workoutBlockId: body.workoutBlockId }),
          ...(body.roleLabel !== undefined && { roleLabel: body.roleLabel }),
          ...(body.effortLabel !== undefined && { effortLabel: body.effortLabel }),
          ...(body.executionLabel !== undefined && { executionLabel: body.executionLabel }),
          ...(body.targetSets !== undefined && { targetSets: body.targetSets }),
          ...(body.targetReps !== undefined && { targetReps: body.targetReps }),
          ...(body.durationSeconds !== undefined && { durationSeconds: body.durationSeconds }),
          ...(body.intensityType !== undefined && { intensityType: body.intensityType }),
          ...(body.intensityTarget !== undefined && { intensityTarget: body.intensityTarget }),
          ...(body.restSeconds !== undefined && { restSeconds: body.restSeconds }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
          ...(body.supersetGroup !== undefined && { supersetGroup: body.supersetGroup }),
          ...(body.groupNote !== undefined && { groupNote: body.groupNote }),
          ...(body.groupIsExtra !== undefined && { groupIsExtra: body.groupIsExtra }),
          ...(body.groupRoleLabel !== undefined && { groupRoleLabel: body.groupRoleLabel }),
          ...(body.groupEffortLabel !== undefined && { groupEffortLabel: body.groupEffortLabel }),
          ...(body.groupExecutionLabel !== undefined && { groupExecutionLabel: body.groupExecutionLabel }),
        },
        include: { exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } } },
      });

      if (groupMetaPatch && finalSupersetGroup) {
        await tx.workoutExercise.updateMany({
          where: {
            workoutTemplateId,
            workoutBlockId: finalBlockId,
            supersetGroup: finalSupersetGroup,
          },
          data: {
            groupNote: body.groupNote ?? null,
            groupIsExtra: body.groupIsExtra ?? false,
            groupRoleLabel: body.groupRoleLabel ?? null,
            groupEffortLabel: body.groupEffortLabel ?? null,
            groupExecutionLabel: body.groupExecutionLabel ?? null,
          },
        });
        return tx.workoutExercise.findUniqueOrThrow({
          where: { id: weId },
          include: { exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } } },
        });
      }

      return next;
    });

    return ok({
      id: updated.id,
      sortOrder: updated.sortOrder,
      supersetGroup: updated.supersetGroup ?? null,
      workoutBlockId: updated.workoutBlockId,
      exercise: updated.exercise,
      targetSets: updated.targetSets,
      targetReps: updated.targetReps,
      durationSeconds: updated.durationSeconds,
      labels: {
        role: updated.roleLabel,
        effort: updated.effortLabel,
        execution: updated.executionLabel,
      },
      intensityType: updated.intensityType,
      intensityTarget: updated.intensityTarget ? String(updated.intensityTarget) : null,
      restSeconds: updated.restSeconds,
      notes: updated.notes,
      groupNote: updated.groupNote ?? null,
      groupIsExtra: updated.groupIsExtra,
      groupLabels: {
        role: updated.groupRoleLabel,
        effort: updated.groupEffortLabel,
        execution: updated.groupExecutionLabel,
      },
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    const we = await verifyOwner(workoutTemplateId, weId, auth.user.sub);
    if (!we) return notFound("Ejercicio no encontrado");

    await prisma.workoutExercise.delete({ where: { id: weId } });
    return ok({ deleted: true });
  });
}
