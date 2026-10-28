"use client";

import { CameraIcon, MicIcon, SquareIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { useMediaUploads } from "@/hooks/use-media-uploads";
import {
  MAX_AUDIO_SECONDS,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGES,
  readAudioDuration,
} from "@/lib/media";

type MediaController = ReturnType<typeof useMediaUploads>;

const MIME_PREFERENCES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function supportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_PREFERENCES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function MediaFields({ media }: { media: MediaController }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Photos (up to {MAX_IMAGES}, JPG/PNG/WebP)
        </span>
        <PhotoPicker
          disabled={media.counts.images >= MAX_IMAGES}
          onAdd={media.addImages}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Voice notes (up to 2, 3 minutes each)
        </span>
        <VoiceRecorder onAdd={media.addAudio} />
      </div>

      {media.error ? (
        <p className="text-sm text-destructive" role="alert">
          {media.error}
        </p>
      ) : null}

      {media.items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {media.items.map((item) => (
            <li
              key={item.localId}
              className="flex items-center gap-3 rounded-lg border p-2"
            >
              {item.kind === "IMAGE" && item.previewUrl ? (
                // Local object URL: nothing to optimise server-side.
                <Image
                  src={item.previewUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded bg-muted"
                >
                  <MicIcon className="size-5 text-muted-foreground" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.label}</p>
                {item.status === "uploading" || item.status === "preparing" ? (
                  <p
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {item.status === "preparing"
                      ? "Preparing…"
                      : `Uploading… ${item.progress}%`}
                  </p>
                ) : item.status === "error" ? (
                  <p className="text-xs text-destructive" role="alert">
                    {item.error ?? "Upload failed."}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Ready</p>
                )}
                {item.kind === "AUDIO" && item.previewUrl ? (
                  <audio
                    controls
                    preload="metadata"
                    src={item.previewUrl}
                    className="mt-1 h-8 w-full"
                    aria-label={`Voice note preview, ${item.label}`}
                  >
                    <track kind="captions" />
                  </audio>
                ) : null}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                aria-label={`Remove ${item.label}`}
                onClick={() => media.remove(item.localId)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PhotoPicker({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (files: File[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void onAdd(files);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon aria-hidden="true" />
          Add photos
        </Button>
        <span className="text-xs text-muted-foreground">
          Photos are resized to {MAX_IMAGE_DIMENSION}px before upload.
        </span>
      </div>
    </>
  );
}

function VoiceRecorder({
  onAdd,
}: {
  onAdd: (blob: Blob, durationSeconds: number, label?: string) => Promise<void>;
}) {
  const [state, setState] = useState<
    "idle" | "requesting" | "recording" | "preview"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
  }

  async function start() {
    setError(null);
    const mimeType = supportedMimeType();
    if (!navigator.mediaDevices?.getUserMedia || mimeType === undefined) {
      setError(
        "This browser cannot record audio. Upload a voice note file instead.",
      );
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1 },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 48_000,
      });
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        stopStream();
        stopTimer();
        const elapsed = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setState("preview");
        setPreview({ blob, url: URL.createObjectURL(blob) });
        setSeconds(elapsed);
      });

      startedAtRef.current = Date.now();
      recorder.start();
      setState("recording");
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_AUDIO_SECONDS) stop();
      }, 500);
    } catch {
      stopStream();
      setState("idle");
      setError(
        "Microphone access was blocked. Allow it, or upload a voice note file instead.",
      );
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopTimer();
  }

  function discard() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setSeconds(0);
    setState("idle");
    setError(null);
  }

  async function acceptPreview() {
    if (!preview) return;
    await onAdd(preview.blob, seconds, "Voice note");
    discard();
  }

  async function addFromFile(file: File) {
    setError(null);
    setFileBusy(true);
    try {
      const duration = await readAudioDuration(file);
      await onAdd(file, Math.round(duration), file.name);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    } finally {
      setFileBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <input
        ref={fileRef}
        type="file"
        accept="audio/webm,audio/ogg,audio/mp4,audio/mpeg,.m4a,.mp3"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void addFromFile(file);
        }}
      />

      {state === "recording" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-2 text-sm font-medium"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className="size-2 animate-pulse rounded-full bg-destructive"
            />
            Recording {formatTime(seconds)} / {formatTime(MAX_AUDIO_SECONDS)}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={stop}>
            <SquareIcon aria-hidden="true" />
            Stop
          </Button>
        </div>
      ) : state === "preview" && preview ? (
        <div className="flex flex-col gap-2">
          <audio
            controls
            src={preview.url}
            className="h-9 w-full"
            aria-label="Voice note preview"
          >
            <track kind="captions" />
          </audio>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void acceptPreview()}
            >
              Use this note
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                discard();
                void start();
              }}
            >
              Re-record
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={discard}>
              Discard
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state === "requesting" || fileBusy}
            onClick={() => void start()}
          >
            <MicIcon aria-hidden="true" />
            {state === "requesting" ? "Starting…" : "Record a voice note"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={state === "requesting" || fileBusy}
            onClick={() => fileRef.current?.click()}
          >
            Upload audio instead
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
