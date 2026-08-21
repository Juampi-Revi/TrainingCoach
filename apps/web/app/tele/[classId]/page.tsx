"use client";

import { useParams } from "next/navigation";
import { TeleClassScreen } from "@/components/features/gym/tele-class-screen";

/** Public TV / display mode — follows coach poll, no local controls. */
export default function PublicTelePage() {
  const { classId } = useParams<{ classId: string }>();
  return <TeleClassScreen classId={classId} controls={false} />;
}
