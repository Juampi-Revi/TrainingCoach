import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarRange,
  ChevronDown,
  Copy,
  Dumbbell,
  LayoutGrid,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

function periodName(periodDays: number) {
  if (periodDays === 7) return "Semana";
  if (periodDays === 14) return "Quincena";
  if (periodDays === 30) return "Mes";
  return "Período";
}

function normalizeTab(tab: string | string[] | undefined) {
  const value = Array.isArray(tab) ? tab[0] : tab;
  if (value === "general" || value === "workouts" || value === "distribution") return value;
  return "general";
}

function normalizeFeedback(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "copy-ok" ||
    raw === "copy-target-required" ||
    raw === "copy-no-target" ||
    raw === "week-add-ok" ||
    raw === "week-add-error" ||
    raw === "week-remove-ok" ||
    raw === "week-remove-error"
  )
    return raw;
  return null;
}

function normalizeAssignmentsFilter(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "active" || raw === "all" || raw === "hidden") return raw;
  return "active";
}

function workoutTypeMeta(type: string | null | undefined) {
  switch (type) {
    case "hypertrophy":
      return { short: "H", label: "Hipertrofia" };
    case "cardio":
      return { short: "C", label: "Cardio" };
    case "sport":
      return { short: "D", label: "Deporte" };
    case "mobility":
      return { short: "M", label: "Movilidad" };
    case "other":
      return { short: "O", label: "Otro" };
    case "strength":
    default:
      return { short: "F", label: "Fuerza" };
  }
}

function PlanStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes =
    normalized === "published"
      ? "border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] text-[color:rgb(var(--tone-success-fg))]"
      : normalized === "archived"
        ? "border-[color:rgb(var(--tone-neutral-border))] bg-[color:rgb(var(--tone-neutral-bg))] text-[color:rgb(var(--tone-neutral-fg))]"
        : "border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] text-[color:rgb(var(--tone-warning-fg))]";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>{status.toUpperCase()}</span>;
}

function AssignmentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes =
    normalized === "active"
      ? "border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] text-[color:rgb(var(--tone-success-fg))]"
      : normalized === "finished"
        ? "border-[color:rgb(var(--tone-neutral-border))] bg-[color:rgb(var(--tone-neutral-bg))] text-[color:rgb(var(--tone-neutral-fg))]"
        : "border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] text-[color:rgb(var(--tone-warning-fg))]";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>{status.toUpperCase()}</span>;
}

function CollapsibleCard({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))]"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="text-lg font-semibold">{title}</span>
        <ChevronDown className="h-5 w-5 text-[color:rgb(var(--muted))]" aria-hidden="true" />
      </summary>
      <div className="border-t border-[color:rgb(var(--border))] p-4">{children}</div>
    </details>
  );
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: { planId: string } | Promise<{ planId: string }>;
  searchParams?:
    | { tab?: string | string[]; feedback?: string | string[]; assignments?: string | string[] }
    | Promise<{ tab?: string | string[]; feedback?: string | string[]; assignments?: string | string[] }>;
}) {
  const { planId } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  const user = session.user;
  if (user.role !== "coach") redirect("/home/client");
  if (!planId) notFound();

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const activeTab = normalizeTab(resolvedSearchParams?.tab);
  const feedback = normalizeFeedback(resolvedSearchParams?.feedback);
  const assignmentsFilter = normalizeAssignmentsFilter(resolvedSearchParams?.assignments);

  const plan = await prisma.plan.findFirst({
    where: { id: planId, coachUserId: user.id },
    select: { id: true, title: true, goal: true, notes: true, weeksCount: true, periodDays: true, status: true, updatedAt: true },
  });

  if (!plan) notFound();

  await prisma.planWeek.createMany({
    data: Array.from({ length: Math.max(1, plan.weeksCount) }).map((_, idx) => ({
      planId: plan.id,
      weekNumber: idx + 1,
    })),
    skipDuplicates: true,
  });

  const planWeeks = await prisma.planWeek.findMany({
    where: { planId: plan.id },
    select: { id: true, weekNumber: true, title: true, notes: true },
    orderBy: { weekNumber: "asc" },
  });

  const scheduledInWeeks = await prisma.planWeekWorkout.findMany({
    where: { planWeekId: { in: planWeeks.map((w) => w.id) } },
    include: { workoutTemplate: true },
    orderBy: [{ planWeekId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const scheduledByWeekId = new Map<string, typeof scheduledInWeeks>();
  for (const s of scheduledInWeeks) {
    const arr = scheduledByWeekId.get(s.planWeekId) ?? [];
    arr.push(s);
    scheduledByWeekId.set(s.planWeekId, arr);
  }

  const planWorkouts = await prisma.planWorkout.findMany({
    where: { planId: plan.id },
    include: {
      workoutTemplate: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const workoutLibrary = await prisma.workoutTemplate.findMany({
    where: { coachUserId: user.id },
    select: { id: true, title: true, description: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const assignments = await prisma.planAssignment.findMany({
    where: { planId: plan.id },
    include: { client: { select: { id: true, displayName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const visibleAssignments =
    assignmentsFilter === "hidden"
      ? []
      : assignmentsFilter === "all"
        ? assignments
        : assignments.filter((a) => a.status === "active");

  const canDeletePlan = assignments.length === 0;
  const planStatus = plan.status.toLowerCase();

  async function updatePlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const title = String(formData.get("title") ?? "").trim();
    const goal = String(formData.get("goal") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const weeksCountRaw = Number(formData.get("weeksCount") ?? 4);
    const weeksCount = Number.isFinite(weeksCountRaw) && weeksCountRaw > 0 ? Math.min(weeksCountRaw, 52) : 4;
    const periodDaysRaw = Number(formData.get("periodDays") ?? 7);
    const periodDays = Number.isFinite(periodDaysRaw) && periodDaysRaw > 0 ? Math.min(periodDaysRaw, 90) : 7;

    await prisma.plan.updateMany({
      where: { id: planId, coachUserId: session.user.id },
      data: {
        title: title || "Plan",
        goal: goal || null,
        notes: notes || null,
        weeksCount,
        periodDays,
      },
    });

    await prisma.planWeek.createMany({
      data: Array.from({ length: weeksCount }).map((_, idx) => ({
        planId,
        weekNumber: idx + 1,
      })),
      skipDuplicates: true,
    });

    redirect(`/home/coach/plans/${planId}?tab=general`);
  }

  async function addWorkoutToPlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const workoutTemplateId = String(formData.get("workoutTemplateId") ?? "");

    const allowed = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: session.user.id },
      select: { id: true },
    });
    if (!allowed) redirect(`/home/coach/plans/${planId}?tab=workouts`);

    const count = await prisma.planWorkout.count({ where: { planId } });
    try {
      await prisma.planWorkout.create({
        data: { planId, workoutTemplateId, sortOrder: count },
        select: { id: true },
      });
    } catch {
      redirect(`/home/coach/plans/${planId}?tab=workouts`);
    }

    redirect(`/home/coach/plans/${planId}?tab=workouts`);
  }

  async function moveWorkoutInPlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planWorkoutId = String(formData.get("planWorkoutId") ?? "");
    const direction = String(formData.get("direction") ?? "");
    if (direction !== "up" && direction !== "down") {
      redirect(`/home/coach/plans/${planId}?tab=workouts`);
    }

    const row = await prisma.planWorkout.findFirst({
      where: { id: planWorkoutId, planId, plan: { coachUserId: session.user.id } },
      select: { id: true },
    });
    if (!row) redirect(`/home/coach/plans/${planId}?tab=workouts`);

    const existing = await prisma.planWorkout.findMany({
      where: { planId },
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const idx = existing.findIndex((e) => e.id === row.id);
    if (idx < 0) redirect(`/home/coach/plans/${planId}?tab=workouts`);

    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= existing.length) redirect(`/home/coach/plans/${planId}?tab=workouts`);

    const moved = [...existing];
    const [item] = moved.splice(idx, 1);
    moved.splice(nextIdx, 0, item);

    await prisma.$transaction(
      moved.map((e, sortOrder) =>
        prisma.planWorkout.update({
          where: { id: e.id },
          data: { sortOrder },
          select: { id: true },
        }),
      ),
    );

    redirect(`/home/coach/plans/${planId}?tab=workouts`);
  }

  async function addWorkoutToWeek(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId") ?? "");
    const planWeekId = String(formData.get("planWeekId") ?? "");
    const workoutTemplateId = String(formData.get("workoutTemplateId") ?? "");
    if (!planId || !planWeekId || !workoutTemplateId) {
      redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-add-error`);
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: session.user.id },
      select: { id: true },
    });
    if (!plan) redirect("/home/coach/plans");

    const planWeek = await prisma.planWeek.findFirst({
      where: { id: planWeekId, planId },
      select: { id: true, weekNumber: true },
    });
    if (!planWeek) redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-add-error`);

    const allowed = await prisma.planWorkout.findFirst({
      where: { planId, workoutTemplateId },
      select: { id: true },
    });
    if (!allowed) redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-add-error`);

    const sortOrder = await prisma.planWeekWorkout.count({ where: { planWeekId } });
    try {
      await prisma.planWeekWorkout.create({
        data: { planWeekId, workoutTemplateId, sortOrder },
        select: { id: true },
      });
    } catch {
      redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-add-error`);
    }

    revalidatePath(`/home/coach/plans/${planId}`);
    revalidatePath(`/home/coach/plans/${planId}/weeks/${planWeek.weekNumber}`);
    redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-add-ok`);
  }

  async function removeWorkoutFromWeek(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId") ?? "");
    const planWeekWorkoutId = String(formData.get("planWeekWorkoutId") ?? "");

    const slot = await prisma.planWeekWorkout.findFirst({
      where: {
        id: planWeekWorkoutId,
        planWeek: { planId, plan: { coachUserId: session.user.id } },
      },
      select: { id: true, planWeekId: true, planWeek: { select: { weekNumber: true } } },
    });
    if (!slot) redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-remove-error`);

    await prisma.planWeekWorkout.delete({ where: { id: slot.id }, select: { id: true } });

    const remaining = await prisma.planWeekWorkout.findMany({
      where: { planWeekId: slot.planWeekId },
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((r, idx) =>
          prisma.planWeekWorkout.update({
            where: { id: r.id },
            data: { sortOrder: idx },
            select: { id: true },
          }),
        ),
      );
    }

    revalidatePath(`/home/coach/plans/${planId}`);
    revalidatePath(`/home/coach/plans/${planId}/weeks/${slot.planWeek.weekNumber}`);
    redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-remove-ok`);
  }

  async function copyWeekDistribution(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId") ?? "");
    const sourcePlanWeekId = String(formData.get("sourcePlanWeekId") ?? "");
    const targetPlanWeekIds = formData
      .getAll("targetPlanWeekId")
      .map((v) => String(v))
      .filter((v) => v && v !== sourcePlanWeekId);

    if (!planId || !sourcePlanWeekId || targetPlanWeekIds.length === 0) {
      redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=copy-target-required`);
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: session.user.id },
      select: { id: true },
    });
    if (!plan) redirect("/home/coach/plans");

    const sourceWeek = await prisma.planWeek.findFirst({
      where: { id: sourcePlanWeekId, planId },
      select: { id: true, weekNumber: true, title: true, notes: true },
    });
    if (!sourceWeek) redirect(`/home/coach/plans/${planId}?tab=distribution`);

    const targets = await prisma.planWeek.findMany({
      where: { id: { in: targetPlanWeekIds }, planId },
      select: { id: true, weekNumber: true },
    });
    if (targets.length === 0) {
      redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=copy-no-target`);
    }

    const sourceSlots = await prisma.planWeekWorkout.findMany({
      where: { planWeekId: sourceWeek.id },
      select: { workoutTemplateId: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    await prisma.$transaction(async (tx) => {
      for (const t of targets) {
        await tx.planWeekWorkout.deleteMany({ where: { planWeekId: t.id } });
        await tx.planWeek.update({
          where: { id: t.id },
          data: { title: sourceWeek.title, notes: sourceWeek.notes },
          select: { id: true },
        });
        if (sourceSlots.length > 0) {
          await tx.planWeekWorkout.createMany({
            data: sourceSlots.map((s, idx) => ({
              planWeekId: t.id,
              workoutTemplateId: s.workoutTemplateId,
              sortOrder: idx,
            })),
          });
        }
      }
    });

    redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=copy-ok`);
  }

  async function saveWeekInfoFromDistribution(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const planId = String(formData.get("planId") ?? "");
    const planWeekId = String(formData.get("planWeekId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    const week = await prisma.planWeek.findFirst({
      where: { id: planWeekId, planId, plan: { coachUserId: session.user.id } },
      select: { id: true },
    });
    if (!week) redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-remove-error`);

    await prisma.planWeek.update({
      where: { id: week.id },
      data: { title: title || null, notes: notes || null },
      select: { id: true },
    });

    redirect(`/home/coach/plans/${planId}?tab=distribution&feedback=week-add-ok`);
  }

  async function setPlanStatus(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const status = String(formData.get("status") ?? "");
    if (status !== "draft" && status !== "published" && status !== "archived") {
      redirect(`/home/coach/plans/${planId}`);
    }

    await prisma.plan.updateMany({
      where: { id: planId, coachUserId: session.user.id },
      data: { status },
    });

    redirect(`/home/coach/plans/${planId}?tab=general`);
  }

  async function deletePlan() {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: session.user.id },
      select: { id: true },
    });
    if (!plan) redirect("/home/coach/plans");

    const assignmentsCount = await prisma.planAssignment.count({ where: { planId: plan.id } });
    if (assignmentsCount > 0) redirect(`/home/coach/plans/${plan.id}?tab=general`);

    await prisma.plan.delete({ where: { id: plan.id } });
    redirect("/home/coach/plans");
  }

  async function duplicatePlan() {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");
    if (session.user.role !== "coach") redirect("/home/client");

    const sourcePlan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: session.user.id },
      select: { id: true, title: true, goal: true, notes: true, weeksCount: true, periodDays: true },
    });
    if (!sourcePlan) redirect("/home/coach/plans");

    const sourceWeeks = await prisma.planWeek.findMany({
      where: { planId: sourcePlan.id },
      select: { id: true, weekNumber: true, title: true, notes: true },
      orderBy: { weekNumber: "asc" },
    });

    const sourcePlanWorkouts = await prisma.planWorkout.findMany({
      where: { planId: sourcePlan.id },
      select: { workoutTemplateId: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const sourceWeekWorkouts = await prisma.planWeekWorkout.findMany({
      where: { planWeekId: { in: sourceWeeks.map((w) => w.id) } },
      select: { planWeekId: true, workoutTemplateId: true, sortOrder: true, createdAt: true },
      orderBy: [{ planWeekId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const newPlanId = await prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: {
          coachUserId: session.user.id,
          title: `${sourcePlan.title} (copia)`,
          goal: sourcePlan.goal,
          notes: sourcePlan.notes,
          weeksCount: sourcePlan.weeksCount,
          periodDays: sourcePlan.periodDays,
          status: "draft",
        },
        select: { id: true },
      });

      const newWeekIdBySourceWeekId = new Map<string, string>();
      for (const w of sourceWeeks) {
        const newWeek = await tx.planWeek.create({
          data: {
            planId: created.id,
            weekNumber: w.weekNumber,
            title: w.title,
            notes: w.notes,
          },
          select: { id: true },
        });
        newWeekIdBySourceWeekId.set(w.id, newWeek.id);
      }

      if (sourcePlanWorkouts.length > 0) {
        await tx.planWorkout.createMany({
          data: sourcePlanWorkouts.map((pw) => ({
            planId: created.id,
            workoutTemplateId: pw.workoutTemplateId,
            sortOrder: pw.sortOrder,
          })),
        });
      }

      const byWeek = new Map<string, Array<{ workoutTemplateId: string; sortOrder: number; createdAt: Date }>>();
      for (const slot of sourceWeekWorkouts) {
        const arr = byWeek.get(slot.planWeekId) ?? [];
        arr.push({ workoutTemplateId: slot.workoutTemplateId, sortOrder: slot.sortOrder, createdAt: slot.createdAt });
        byWeek.set(slot.planWeekId, arr);
      }

      for (const [sourceWeekId, slots] of byWeek.entries()) {
        const newWeekId = newWeekIdBySourceWeekId.get(sourceWeekId);
        if (!newWeekId) continue;
        const ordered = [...slots].sort((a, b) => (a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.createdAt.getTime() - b.createdAt.getTime()));
        await tx.planWeekWorkout.createMany({
          data: ordered.map((s, idx) => ({
            planWeekId: newWeekId,
            workoutTemplateId: s.workoutTemplateId,
            sortOrder: idx,
          })),
        });
      }

      return created.id;
    });

    redirect(`/home/coach/plans/${newPlanId}?tab=general`);
  }

  const weekGroups = Array.from({ length: Math.ceil(planWeeks.length / 4) }, (_, idx) => planWeeks.slice(idx * 4, idx * 4 + 4));
  const returnTo = encodeURIComponent(`/home/coach/plans/${plan.id}?tab=distribution`);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{plan.title}</h1>
            <PlanStatusBadge status={plan.status} />
          </div>
          <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">
            <CalendarRange className="mr-1 inline-block h-4 w-4" aria-hidden="true" />
            {plan.weeksCount} {plan.weeksCount === 1 ? "período" : "períodos"} · {plan.periodDays} días c/u · Total {plan.weeksCount * plan.periodDays} días
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
          href="/home/coach/plans"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a planes
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/home/coach/plans/${plan.id}?tab=general`}
            className={
              activeTab === "general"
                ? "inline-flex items-center gap-2 rounded-lg bg-[color:rgb(var(--primary))] px-3 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))]"
                : "inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
            }
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Config general
          </Link>
          <Link
            href={`/home/coach/plans/${plan.id}?tab=workouts`}
            className={
              activeTab === "workouts"
                ? "inline-flex items-center gap-2 rounded-lg bg-[color:rgb(var(--primary))] px-3 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))]"
                : "inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
            }
          >
            <Dumbbell className="h-4 w-4" aria-hidden="true" />
            Entrenamientos
          </Link>
          <Link
            href={`/home/coach/plans/${plan.id}?tab=distribution`}
            className={
              activeTab === "distribution"
                ? "inline-flex items-center gap-2 rounded-lg bg-[color:rgb(var(--primary))] px-3 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))]"
                : "inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
            }
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            Organización
          </Link>
        </div>
      </section>

      {activeTab === "general" ? (
        <>
          <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:rgb(var(--muted))]">Acciones</div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={setPlanStatus}>
                  <input type="hidden" name="status" value={planStatus === "published" ? "draft" : "published"} />
                  <button
                    type="submit"
                    className={
                      planStatus === "published"
                        ? "inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--tone-warning-fg))] hover:opacity-90"
                        : "inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--tone-success-fg))] hover:opacity-90"
                    }
                  >
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    {planStatus === "published" ? "Pasar a borrador" : "Publicar"}
                  </button>
                </form>
                <form action={duplicatePlan}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Duplicar
                  </button>
                </form>
                <form action={setPlanStatus}>
                  <input type="hidden" name="status" value="archived" />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--tone-neutral-border))] bg-[color:rgb(var(--tone-neutral-bg))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--tone-neutral-fg))] hover:opacity-90"
                  >
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    Archivar
                  </button>
                </form>
                <form action={deletePlan}>
                  <button
                    type="submit"
                    disabled={!canDeletePlan}
                    className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--tone-danger-border))] bg-[color:rgb(var(--tone-danger-bg))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--tone-danger-fg))] hover:opacity-90 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
            {!canDeletePlan ? (
              <div className="mt-2 text-sm text-[color:rgb(var(--muted))]">No se puede eliminar porque tiene asignaciones (historial).</div>
            ) : null}
          </section>

          <CollapsibleCard title="Config general" defaultOpen>
            <form action={updatePlan} className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="title">
                  Título
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={plan.title}
                  className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                  required
                />
              </div>

              <div className="flex flex-wrap items-start gap-4">
                <div>
                  <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="weeksCount">
                    Cantidad de períodos
                  </label>
                  <input
                    id="weeksCount"
                    name="weeksCount"
                    type="number"
                    min={1}
                    max={52}
                    defaultValue={plan.weeksCount}
                    className="mt-1 block w-40 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                  />
                  <div className="mt-1 text-xs text-[color:rgb(var(--muted))]">
                    1 período = la duración elegida (7/14/30 días)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="periodDays">
                    Duración del período (días)
                  </label>
                  <select
                    id="periodDays"
                    name="periodDays"
                    defaultValue={plan.periodDays}
                    className="mt-1 block w-40 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                  >
                    <option value={7}>7 (semanal)</option>
                    <option value={14}>14 (quincenal)</option>
                    <option value={30}>30 (mensual)</option>
                  </select>
                  <div className="mt-1 text-xs text-[color:rgb(var(--muted))]">Duración total: {plan.weeksCount * plan.periodDays} días</div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="goal">
                    Objetivo
                  </label>
                  <input
                    id="goal"
                    name="goal"
                    defaultValue={plan.goal ?? ""}
                    className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="notes">
                  Notas
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={plan.notes ?? ""}
                  className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                  placeholder="Opcional"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[color:rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[color:rgb(var(--primary-fg))] hover:opacity-90"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Guardar
                </button>
              </div>
            </form>
          </CollapsibleCard>

          <CollapsibleCard title="Asignar a alumno" defaultOpen={false}>
            <p className="text-sm text-[color:rgb(var(--muted))]">
              Las asignaciones se gestionan desde{" "}
              <Link className="text-[color:rgb(var(--primary))] hover:underline" href="/home/coach/alumnos">
                Alumnos
              </Link>
              .
            </p>

            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[color:rgb(var(--muted))]">Asignaciones recientes</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    className={
                      assignmentsFilter === "active"
                        ? "rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1 text-[color:rgb(var(--fg))]"
                        : "rounded-full border border-[color:rgb(var(--border))] px-3 py-1 text-[color:rgb(var(--muted))] hover:bg-[color:rgb(var(--bg))]"
                    }
                    href={`/home/coach/plans/${plan.id}?tab=general&assignments=active`}
                  >
                    Solo activas
                  </Link>
                  <Link
                    className={
                      assignmentsFilter === "all"
                        ? "rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1 text-[color:rgb(var(--fg))]"
                        : "rounded-full border border-[color:rgb(var(--border))] px-3 py-1 text-[color:rgb(var(--muted))] hover:bg-[color:rgb(var(--bg))]"
                    }
                    href={`/home/coach/plans/${plan.id}?tab=general&assignments=all`}
                  >
                    Todas
                  </Link>
                  <Link
                    className={
                      assignmentsFilter === "hidden"
                        ? "rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-1 text-[color:rgb(var(--fg))]"
                        : "rounded-full border border-[color:rgb(var(--border))] px-3 py-1 text-[color:rgb(var(--muted))] hover:bg-[color:rgb(var(--bg))]"
                    }
                    href={`/home/coach/plans/${plan.id}?tab=general&assignments=hidden`}
                  >
                    Ocultar
                  </Link>
                </div>
              </div>

              {assignments.length === 0 ? (
                <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Todavía no hay asignaciones.</p>
              ) : assignmentsFilter === "hidden" ? (
                <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">Asignaciones ocultas.</p>
              ) : visibleAssignments.length === 0 ? (
                <p className="mt-2 text-sm text-[color:rgb(var(--muted))]">No hay asignaciones para ese filtro.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {visibleAssignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.client.displayName ?? a.client.email}</div>
                        <div className="mt-2">
                          <AssignmentStatusBadge status={a.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CollapsibleCard>
        </>
      ) : null}

      {activeTab === "workouts" ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Entrenamientos del plan</h2>
              <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">Agregá entrenamientos de tu biblioteca para después distribuirlos.</p>
            </div>
          </div>

          <form action={addWorkoutToPlan} className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[color:rgb(var(--muted))]" htmlFor="workoutTemplateId">
                Biblioteca
              </label>
              <select
                id="workoutTemplateId"
                name="workoutTemplateId"
                className="mt-1 block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                required
              >
                <option value="">Seleccioná un entrenamiento…</option>
                {workoutLibrary.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-4 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar al plan
              </button>
            </div>
          </form>

          {planWorkouts.length === 0 ? (
            <p className="mt-4 text-sm text-[color:rgb(var(--muted))]">Todavía no agregaste entrenamientos al plan.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {planWorkouts.map((pw) => {
                const meta = workoutTypeMeta(pw.workoutTemplate.type);
                return (
                  <li
                    key={pw.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] text-[10px] font-semibold">
                          {meta.short}
                        </span>
                        <div className="min-w-0 truncate font-medium">{pw.workoutTemplate.title}</div>
                        <span className="text-xs text-[color:rgb(var(--muted))]">{meta.label}</span>
                      </div>
                      <div className="text-sm text-[color:rgb(var(--muted))]">{pw.workoutTemplate.description ?? "Sin descripción"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={moveWorkoutInPlan}>
                        <input type="hidden" name="planWorkoutId" value={pw.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-2 text-sm hover:bg-[color:rgb(var(--card))]"
                          aria-label="Subir"
                        >
                          <ChevronDown className="h-4 w-4 rotate-180" aria-hidden="true" />
                        </button>
                      </form>
                      <form action={moveWorkoutInPlan}>
                        <input type="hidden" name="planWorkoutId" value={pw.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-2 text-sm hover:bg-[color:rgb(var(--card))]"
                          aria-label="Bajar"
                        >
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                      <Link
                        className="inline-flex items-center gap-1 text-sm text-[color:rgb(var(--primary))] hover:underline"
                        href={`/home/coach/workouts/${pw.workoutTemplate.id}`}
                      >
                        Editar
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === "distribution" ? (
        <section className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Organización de períodos</h2>
              <p className="mt-1 text-sm text-[color:rgb(var(--muted))]">
                Distribuí los entrenamientos en cada período desde esta vista (podés repetirlos entre períodos).
              </p>
            </div>
          </div>
          {feedback === "copy-ok" ? (
            <div className="mt-3 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm">
              Período duplicado correctamente.
            </div>
          ) : null}
          {feedback === "copy-target-required" || feedback === "copy-no-target" ? (
            <div className="mt-3 rounded-lg border border-[color:rgb(var(--tone-warning-border))] bg-[color:rgb(var(--tone-warning-bg))] px-3 py-2 text-sm text-[color:rgb(var(--tone-warning-fg))]">
              Seleccioná un período destino para copiar.
            </div>
          ) : null}
          {feedback === "week-add-ok" ? (
            <div className="mt-3 rounded-lg border border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] px-3 py-2 text-sm text-[color:rgb(var(--tone-success-fg))]">
              Entrenamiento agregado al período.
            </div>
          ) : null}
          {feedback === "week-remove-ok" ? (
            <div className="mt-3 rounded-lg border border-[color:rgb(var(--tone-success-border))] bg-[color:rgb(var(--tone-success-bg))] px-3 py-2 text-sm text-[color:rgb(var(--tone-success-fg))]">
              Entrenamiento quitado del período.
            </div>
          ) : null}
          {feedback === "week-add-error" || feedback === "week-remove-error" ? (
            <div className="mt-3 rounded-lg border border-[color:rgb(var(--tone-danger-border))] bg-[color:rgb(var(--tone-danger-bg))] px-3 py-2 text-sm text-[color:rgb(var(--tone-danger-fg))]">
              No se pudo completar la acción. Probá de nuevo.
            </div>
          ) : null}
          {planWorkouts.length === 0 ? (
            <p className="mt-3 text-sm text-[color:rgb(var(--muted))]">
              Primero agregá entrenamientos en la pestaña{" "}
              <Link className="text-[color:rgb(var(--primary))] hover:underline" href={`/home/coach/plans/${plan.id}?tab=workouts`}>
                Entrenamientos
              </Link>
              .
            </p>
          ) : null}
          <div className="mt-4 space-y-4">
            {weekGroups.map((group, groupIdx) => (
              <div key={group[0]?.id ?? groupIdx} className="rounded-2xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))]">
                <table className="w-full table-fixed border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {group.map((w, idx) => (
                        <th
                          key={w.id}
                          id={`periodo-${w.weekNumber}`}
                          className={
                            idx === 0
                              ? "p-3 text-left align-top text-sm font-semibold"
                              : "border-l border-[color:rgb(var(--border))] p-3 text-left align-top text-sm font-semibold"
                          }
                        >
                          {periodName(plan.periodDays)} {w.weekNumber}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top">
                      {group.map((w, idx) => {
                        const scheduled = scheduledByWeekId.get(w.id) ?? [];
                        return (
                          <td
                            key={w.id}
                            className={
                              idx === 0
                                ? "border-t border-[color:rgb(var(--border))] p-3 align-top"
                                : "border-l border-t border-[color:rgb(var(--border))] p-3 align-top"
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm text-[color:rgb(var(--muted))]">{w.title ?? "Sin título"}</div>
                                <div className="mt-1 truncate text-xs text-[color:rgb(var(--muted))]">{w.notes ?? "Sin notas"}</div>
                              </div>
                              <Link
                                className="inline-flex items-center gap-1 text-sm text-[color:rgb(var(--primary))] hover:underline"
                                href={`/home/coach/plans/${plan.id}/weeks/${w.weekNumber}`}
                              >
                                Abrir
                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </div>

                            <details className="mt-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-2">
                              <summary className="cursor-pointer text-xs font-medium text-[color:rgb(var(--primary))]">
                                Copiar período (opcional)
                              </summary>
                              <div className="mt-2 space-y-2">
                                {group.filter((other) => other.id !== w.id).length > 0 ? (
                                  <form action={copyWeekDistribution} className="grid gap-2">
                                    <input type="hidden" name="planId" value={plan.id} />
                                    <input type="hidden" name="sourcePlanWeekId" value={w.id} />
                                    <select
                                      name="targetPlanWeekId"
                                      required
                                      defaultValue=""
                                      className="block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                                    >
                                      <option value="">Elegí período destino…</option>
                                      {planWeeks
                                        .filter((other) => other.id !== w.id)
                                        .map((other) => (
                                          <option key={other.id} value={other.id}>
                                            {periodName(plan.periodDays)} {other.weekNumber}
                                          </option>
                                        ))}
                                    </select>
                                    <button
                                      type="submit"
                                      className="inline-flex w-fit items-center gap-1 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-1 text-xs font-medium hover:bg-[color:rgb(var(--card))]"
                                    >
                                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                      Copiar
                                    </button>
                                  </form>
                                ) : (
                                  <div className="text-xs text-[color:rgb(var(--muted))]">No hay otro período disponible para copiar.</div>
                                )}
                              </div>
                            </details>

                            <details className="mt-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] p-2">
                              <summary className="cursor-pointer text-xs font-medium text-[color:rgb(var(--primary))]">Editar título y notas</summary>
                              <form action={saveWeekInfoFromDistribution} className="mt-2 grid gap-2">
                                <input type="hidden" name="planId" value={plan.id} />
                                <input type="hidden" name="planWeekId" value={w.id} />
                                <input
                                  name="title"
                                  defaultValue={w.title ?? ""}
                                  placeholder="Título (ej: Semana de descarga)"
                                  className="block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                                />
                                <textarea
                                  name="notes"
                                  rows={2}
                                  defaultValue={w.notes ?? ""}
                                  placeholder="Notas (ej: semana de testeo RM)"
                                  className="block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                                />
                                <button
                                  type="submit"
                                  className="inline-flex w-fit items-center gap-1 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-2 py-1 text-xs font-medium hover:bg-[color:rgb(var(--card))]"
                                >
                                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                                  Guardar
                                </button>
                              </form>
                            </details>

                            <div className="mt-3 space-y-2">
                              {scheduled.length === 0 ? (
                                <div className="text-sm text-[color:rgb(var(--muted))]">Sin entrenamientos.</div>
                              ) : (
                                scheduled.map((s) => {
                                  const meta = workoutTypeMeta(s.workoutTemplate.type);
                                  return (
                                    <div
                                      key={s.id}
                                      className="flex items-start justify-between gap-3 rounded-xl border border-[color:rgb(var(--border))] bg-[color:rgb(var(--card))] px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] text-[10px] font-semibold">
                                            {meta.short}
                                          </span>
                                          <div className="min-w-0 truncate text-sm font-medium">{s.workoutTemplate.title}</div>
                                          <span className="text-xs text-[color:rgb(var(--muted))]">{meta.label}</span>
                                        </div>
                                        <div className="truncate text-xs text-[color:rgb(var(--muted))]">
                                          {s.workoutTemplate.description ?? "Sin descripción"}
                                        </div>
                                      </div>
                                      <Link
                                        className="inline-flex items-center gap-1 text-xs text-[color:rgb(var(--primary))] hover:underline"
                                        href={`/home/coach/workouts/${s.workoutTemplate.id}?returnTo=${returnTo}`}
                                      >
                                        Editar
                                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                      </Link>
                                      <form action={removeWorkoutFromWeek}>
                                        <input type="hidden" name="planId" value={plan.id} />
                                        <input type="hidden" name="planWeekWorkoutId" value={s.id} />
                                        <button
                                          type="submit"
                                          className="inline-flex items-center gap-1 text-xs text-[color:rgb(var(--tone-danger-fg))] hover:underline"
                                        >
                                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                                          Quitar
                                        </button>
                                      </form>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            <form action={addWorkoutToWeek} className="mt-3 grid gap-2">
                              <input type="hidden" name="planId" value={plan.id} />
                              <input type="hidden" name="planWeekId" value={w.id} />
                              <select
                                name="workoutTemplateId"
                                className="block w-full rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary))]"
                                required
                                disabled={planWorkouts.length === 0}
                              >
                                <option value="">Seleccioná un entrenamiento…</option>
                                {planWorkouts.map((pw) => (
                                  <option key={pw.workoutTemplate.id} value={pw.workoutTemplate.id}>
                                    {pw.workoutTemplate.title}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-lg border border-[color:rgb(var(--border))] bg-[color:rgb(var(--bg))] px-3 py-2 text-sm font-medium hover:bg-[color:rgb(var(--card))]"
                                disabled={planWorkouts.length === 0}
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Agregar
                              </button>
                            </form>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
