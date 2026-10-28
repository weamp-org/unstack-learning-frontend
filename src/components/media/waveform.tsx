"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BAR_COUNT = 64;

/**
 * Waveform player for voice notes.
 *
 * Peaks come from decoding the file in the browser, so no extra dependency and
 * no server-side audio processing. Decoding can fail (Safari cannot decode a
 * WebM recorded in Chrome), in which case we fall back to native controls
 * rather than leaving the teacher with nothing playable.
 */
export function Waveform({
  src,
  className,
  label = "Voice note",
}: {
  src: string;
  className?: string;
  label?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [peaks, setPeaks] = useState<{ id: number; value: number }[] | null>(
    null,
  );
  const [undecodable, setUndecodable] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    setUndecodable(false);

    void (async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        const context = new AudioContext();
        const decoded = await context.decodeAudioData(buffer);
        const samples = decoded.getChannelData(0);
        const block = Math.max(1, Math.floor(samples.length / BAR_COUNT));
        const values: number[] = [];
        for (let bar = 0; bar < BAR_COUNT; bar += 1) {
          let sum = 0;
          const start = bar * block;
          const end = Math.min(samples.length, start + block);
          for (let index = start; index < end; index += 1) {
            sum += Math.abs(samples[index]);
          }
          values.push(sum / Math.max(1, end - start));
        }
        const loudest = Math.max(...values, 0.0001);
        if (!cancelled) {
          setPeaks(
            values.map((value, id) => ({
              id,
              value: Math.max(0.08, value / loudest),
            })),
          );
        }
        void context.close();
      } catch {
        if (!cancelled) setUndecodable(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setUndecodable(true));
    } else {
      audio.pause();
    }
  }

  function seekTo(ratio: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) {
      return;
    }
    const clamped = Math.min(1, Math.max(0, ratio));
    audio.currentTime = clamped * audio.duration;
    setCurrent(audio.currentTime);
  }

  function onTrackClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo((event.clientX - rect.left) / rect.width);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekTo((current + 5) / Math.max(duration, 0.001));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekTo((current - 5) / Math.max(duration, 0.001));
    } else if (event.key === "Home") {
      event.preventDefault();
      seekTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seekTo(1);
    }
  }

  if (undecodable || peaks === null) {
    return (
      <audio
        controls
        preload="metadata"
        src={src}
        className={cn("h-9 w-full", className)}
        aria-label={label}
      >
        <track kind="captions" />
      </audio>
    );
  }

  const progress = duration > 0 ? current / duration : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        onClick={toggle}
      >
        {playing ? (
          <PauseIcon aria-hidden="true" />
        ) : (
          <PlayIcon aria-hidden="true" />
        )}
      </Button>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`Seek ${label}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
        className="flex h-10 flex-1 cursor-pointer items-center gap-[2px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={onTrackClick}
        onKeyDown={onKeyDown}
      >
        {peaks.map((peak) => (
          <span
            key={peak.id}
            aria-hidden="true"
            style={{ height: `${Math.round(peak.value * 100)}%` }}
            className={cn(
              "min-h-[3px] flex-1 rounded-full transition-colors",
              peak.id / peaks.length <= progress
                ? "bg-primary"
                : "bg-muted-foreground/30",
            )}
          />
        ))}
      </div>

      <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(total / 60);
  return `${minutes}:${(total % 60).toString().padStart(2, "0")}`;
}
