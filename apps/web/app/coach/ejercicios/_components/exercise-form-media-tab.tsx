"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { MediaManager } from "../../workouts/[workoutTemplateId]/_components/media-manager";

type MediaItem = { id: string; url: string; mediaType: string };

export function ExerciseFormMediaTab({
  exerciseId,
  exerciseName,
  readOnly = false,
}: {
  exerciseId: string;
  exerciseName: string;
  readOnly?: boolean;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<{
        images: Array<{
          id: string;
          mediaType: "image";
          url: string;
          publicId?: string;
          thumbnailUrl?: string;
          previewUrl?: string;
          isPrimary?: boolean;
          displayOrder?: number;
        }>;
        videos: Array<{
          id: string;
          mediaType: "video";
          url: string;
          publicId?: string;
          videoId?: string;
          embedUrl?: string;
          thumbnailUrl?: string;
        }>;
      }>(`/coach/exercises/${exerciseId}/media`)
      .then((res) => {
        if (cancelled) return;
        setMedia([
          ...res.images.map((img) => ({ ...img, mediaType: "image" as const })),
          ...res.videos.map((vid) => ({ ...vid, mediaType: "video" as const })),
        ]);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        toast.error(e instanceof Error ? e.message : "Error al cargar media");
      });
    return () => {
      cancelled = true;
    };
  }, [api, exerciseId, toast]);

  return (
    <MediaManager
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      readOnly={readOnly}
      media={media.map((m) => ({ ...m, mediaType: m.mediaType as "image" | "video" }))}
      onMediaChange={async () => {
        try {
          const res = await api.get<{
            images: Array<{ id: string; mediaType: "image"; url: string }>;
            videos: Array<{ id: string; mediaType: "video"; url: string }>;
          }>(`/coach/exercises/${exerciseId}/media`);
          setMedia([
            ...res.images.map((img) => ({ ...img, mediaType: "image" as const })),
            ...res.videos.map((vid) => ({ ...vid, mediaType: "video" as const })),
          ]);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al cargar media");
        }
      }}
      limits={{ maxImages: 3, maxVideos: 1 }}
    />
  );
}
