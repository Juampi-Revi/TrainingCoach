"use client";

import { useParams } from "next/navigation";
import { TeleClassScreen } from "@/components/features/gym/tele-class-screen";

/** Gym operator tele mode — timer + prev/next controls. */
export default function GymTelePage() {
  const { classId } = useParams<{ classId: string }>();
  return <TeleClassScreen classId={classId} controls />;
}
