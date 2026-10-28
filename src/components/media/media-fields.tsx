"use client";

import {
  CameraIcon,
  ImageIcon,
  MicIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Waveform } from "@/components/media/waveform";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Waveform as WaveformCanvas } from "@/components/ui/waveform";
import type { MediaItem, useMediaUploads } from "@/hooks/use-media-uploads";
import { MAX_AUDIO_SECONDS, MAX_IMAGES, readAudioDuration } from "@/lib/media";

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

function attachmentState(item: MediaItem) {
  switch (item.status) {
    case "ready":
      return "done" as const;
    case "error":
      return "error" as const;
    case "preparing":
      return "processing" as const;
    default:
      return "uploading" as const;
  }
}

export function MediaFields({ media }: { media: MediaController }) {
  const photos = media.items.filter((item) => item.kind === "IMAGE");
  const notes = media.items.filter((item) => item.kind === "AUDIO");

  return (
    <div className="flex flex-col gap-5">
      <PhotoDropzone media={media} photos={photos} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Voice notes · up to 2 · 3 minutes each
        </span>
        <VoiceRecorder onAdd={media.addAudio} />

        {notes.map((item) => (
          <div
            key={item.localId}
            className="flex flex-col gap-2 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <MicIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="max-w-40 truncate text-xs text-muted-foreground">
                  {item.status === "ready"
                    ? formatDuration(item.durationSeconds ?? 0)
                    : item.status === "error"
                      ? (item.error ?? "Upload failed")
                      : `Uploading… ${item.progress}%`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={`Remove ${item.label}`}
                  onClick={() => media.remove(item.localId)}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </div>
            </div>
            {item.previewUrl ? (
              <Waveform src={item.previewUrl} label={item.label} />
            ) : null}
          </div>
        ))}
      </div>

      {media.error ? (
        <p className="text-sm text-destructive" role="alert">
          {media.error}
        </p>
      ) : null}
    </div>
  );
}

function PhotoDropzone({
  media,
  photos,
}: {
  media: MediaController;
  photos: MediaItem[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = photos.length >= MAX_IMAGES;

  function handleFiles(files: File[]) {
    if (files.length > 0) void media.addImages(files);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Photos · up to {MAX_IMAGES}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          handleFiles(files);
        }}
      />

      {/* biome-ignore lint/a11y/noStaticElementInteractions: dropping is a
          pointer-only enhancement; the Add photos button is the accessible path. */}
      <div
        onDragOver={(event) => {
          if (full) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (full) return;
          handleFiles(Array.from(event.dataTransfer.files));
        }}
        className={
          dragging
            ? "rounded-xl bg-primary/5 p-1 ring-2 ring-primary/40"
            : "rounded-xl p-1"
        }
      >
        <AttachmentGroup>
          <Attachment state="idle" orientation="vertical" size="sm">
            <AttachmentMedia variant="icon">
              <CameraIcon aria-hidden="true" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>Add photos</AttachmentTitle>
              <AttachmentDescription>
                {full ? "Limit reached" : "Click or drop here"}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentTrigger
              aria-label="Add photos"
              disabled={full}
              onClick={() => inputRef.current?.click()}
            />
          </Attachment>

          {photos.map((item) => (
            <Attachment
              key={item.localId}
              state={attachmentState(item)}
              orientation="vertical"
              size="sm"
            >
              <AttachmentMedia variant="image">
                {item.previewUrl ? (
                  <Image
                    src={item.previewUrl}
                    alt=""
                    width={96}
                    height={96}
                    unoptimized
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <ImageIcon aria-hidden="true" />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{item.label}</AttachmentTitle>
                <AttachmentDescription>
                  {item.status === "ready"
                    ? "Ready"
                    : item.status === "error"
                      ? (item.error ?? "Upload failed")
                      : item.status === "preparing"
                        ? "Preparing…"
                        : `Uploading… ${item.progress}%`}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  aria-label={`Remove ${item.label}`}
                  onClick={() => media.remove(item.localId)}
                >
                  <XIcon aria-hidden="true" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>

      <p className="text-xs text-muted-foreground">
        Photos are resized before upload.
      </p>
    </div>
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
  const [levels, setLevels] = useState<number[]>(() => new Array(48).fill(0));
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      void audioContextRef.current?.close();
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function stopMeter() {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setLevels(new Array(48).fill(0));
  }

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

  function startMeter(stream: MediaStream) {
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    audioContextRef.current = context;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastPaint = 0;
    const paint = (time: number) => {
      if (time - lastPaint > 60) {
        analyser.getByteFrequencyData(data);
        const bars = 48;
        const step = Math.max(1, Math.floor(data.length / bars));
        setLevels(
          Array.from({ length: bars }, (_, index) => {
            let sum = 0;
            for (let offset = 0; offset < step; offset += 1) {
              sum += data[index * step + offset] ?? 0;
            }
            return sum / step / 255;
          }),
        );
        lastPaint = time;
      }
      animationRef.current = window.requestAnimationFrame(paint);
    };
    animationRef.current = window.requestAnimationFrame(paint);
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
        stopMeter();
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
      startMeter(stream);
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
    <div className="flex flex-col gap-3 rounded-lg border p-3">
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
        <div className="flex flex-col gap-2">
          <WaveformCanvas
            aria-hidden="true"
            data={levels}
            height={44}
            barWidth={2}
            barGap={2}
            barRadius={1}
            fadeEdges={false}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium" aria-live="polite">
              Recording {formatDuration(seconds)} /{" "}
              {formatDuration(MAX_AUDIO_SECONDS)}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={stop}>
              <SquareIcon aria-hidden="true" />
              Stop
            </Button>
          </div>
        </div>
      ) : state === "preview" && preview ? (
        <div className="flex flex-col gap-3">
          <Waveform src={preview.url} label="Your voice note" />
          <div className="flex flex-wrap gap-2 border-t pt-3">
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

function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${Math.round(safe % 60)
    .toString()
    .padStart(2, "0")}`;
}
