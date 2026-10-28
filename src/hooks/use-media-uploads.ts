"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  abandonUpload,
  compressImage,
  isAllowedImage,
  MAX_AUDIO_BYTES,
  MAX_AUDIO_NOTES,
  MAX_AUDIO_SECONDS,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGES,
  type MediaKind,
  MIN_AUDIO_SECONDS,
  normalizeContentType,
  uploadMedia,
} from "@/lib/media";

export type MediaItemStatus = "preparing" | "uploading" | "ready" | "error";

export interface MediaItem {
  localId: string;
  kind: MediaKind;
  label: string;
  previewUrl?: string;
  durationSeconds?: number;
  status: MediaItemStatus;
  progress: number;
  mediaId?: string;
  error?: string;
}

/**
 * Owns the client side of attachments: validation, compression, presign +
 * PUT + complete, and cleanup. A file is only "ready" once the backend has
 * verified the object, so the form can gate submit on that.
 */
export function useMediaUploads() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const previews = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const update = useCallback((localId: string, patch: Partial<MediaItem>) => {
    setItems((current) =>
      current.map((item) =>
        item.localId === localId ? { ...item, ...patch } : item,
      ),
    );
  }, []);

  const counts = useMemo(
    () => ({
      images: items.filter((item) => item.kind === "IMAGE").length,
      audio: items.filter((item) => item.kind === "AUDIO").length,
    }),
    [items],
  );

  const upload = useCallback(
    async (
      localId: string,
      blob: Blob,
      contentType: string,
      kind: MediaKind,
      durationSeconds?: number,
    ) => {
      update(localId, { status: "uploading", progress: 0 });
      try {
        const mediaId = await uploadMedia(blob, {
          kind,
          contentType,
          durationSeconds,
          onProgress: (progress) => update(localId, { progress }),
        });
        update(localId, { status: "ready", progress: 100, mediaId });
      } catch (cause) {
        update(localId, {
          status: "error",
          error:
            cause instanceof Error
              ? cause.message
              : "Upload failed. Please try again.",
        });
      }
    },
    [update],
  );

  const addImages = useCallback(
    async (files: File[]) => {
      setError(null);
      const room = MAX_IMAGES - counts.images;
      if (room <= 0) {
        setError(`You can attach at most ${MAX_IMAGES} photos.`);
        return;
      }
      const accepted = files.slice(0, room);
      if (files.length > room) {
        setError(
          `Only ${room} more photo${room === 1 ? "" : "s"} can be added.`,
        );
      }

      for (const file of accepted) {
        if (!isAllowedImage(file)) {
          setError("Photos must be JPG, PNG, or WebP.");
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setError("Each photo must be under 10 MB.");
          continue;
        }
        if (
          items.filter((item) => item.kind === "IMAGE").length >= MAX_IMAGES
        ) {
          break;
        }

        const localId = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        previews.current.set(localId, previewUrl);
        const item: MediaItem = {
          localId,
          kind: "IMAGE",
          label: file.name,
          previewUrl,
          status: "preparing",
          progress: 0,
        };
        setItems((current) => [...current, item]);

        try {
          const compressed = await compressImage(file);
          update(localId, {
            status: "uploading",
            label: file.name,
            previewUrl,
          });
          await upload(
            localId,
            compressed.blob,
            compressed.contentType,
            "IMAGE",
          );
        } catch (cause) {
          update(localId, {
            status: "error",
            error:
              cause instanceof Error
                ? cause.message
                : "Could not prepare that photo.",
          });
        }
      }
    },
    [counts.images, items, update, upload],
  );

  const addAudio = useCallback(
    async (blob: Blob, durationSeconds: number, label = "Voice note") => {
      setError(null);
      if (counts.audio >= MAX_AUDIO_NOTES) {
        setError(`You can attach at most ${MAX_AUDIO_NOTES} voice notes.`);
        return;
      }
      if (blob.size > MAX_AUDIO_BYTES) {
        setError("Each voice note must be under 10 MB.");
        return;
      }
      if (
        durationSeconds < MIN_AUDIO_SECONDS ||
        durationSeconds > MAX_AUDIO_SECONDS
      ) {
        setError("Voice notes must be between 1 second and 3 minutes.");
        return;
      }

      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(blob);
      previews.current.set(localId, previewUrl);
      const contentType = normalizeContentType(blob.type) || "audio/webm";
      setItems((current) => [
        ...current,
        {
          localId,
          kind: "AUDIO",
          label,
          previewUrl,
          durationSeconds,
          status: "uploading",
          progress: 0,
        },
      ]);
      await upload(localId, blob, contentType, "AUDIO", durationSeconds);
    },
    [counts.audio, upload],
  );

  const remove = useCallback((localId: string) => {
    setItems((current) => {
      const item = current.find((entry) => entry.localId === localId);
      if (item?.mediaId) {
        // Staged uploads are safe to drop; the server ignores failures here.
        void abandonUpload(item.mediaId).catch(() => undefined);
      }
      const preview = previews.current.get(localId);
      if (preview) {
        URL.revokeObjectURL(preview);
        previews.current.delete(localId);
      }
      return current.filter((entry) => entry.localId !== localId);
    });
  }, []);

  const readyIds = useMemo(
    () =>
      items
        .filter((item) => item.status === "ready" && item.mediaId)
        .map((item) => item.mediaId as string),
    [items],
  );

  const busy = items.some(
    (item) => item.status === "preparing" || item.status === "uploading",
  );

  return {
    items,
    counts,
    readyIds,
    busy,
    error,
    clearError: () => setError(null),
    addImages,
    addAudio,
    remove,
  };
}

/** Exported for the form copy; keeps the two limits in one place. */
export const MEDIA_LIMITS = {
  images: MAX_IMAGES,
  audio: MAX_AUDIO_NOTES,
  maxDimension: MAX_IMAGE_DIMENSION,
};
