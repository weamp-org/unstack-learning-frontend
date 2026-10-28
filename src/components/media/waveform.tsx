"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { AudioScrubber } from "@/components/ui/waveform";
import { cn } from "@/lib/utils";

const PEAK_COUNT = 256;

/**
 * Waveform player for voice notes, built on the ElevenLabs UI canvas
 * scrubber. Peaks are decoded in the browser, so there is no server-side
 * audio processing. Decoding can fail (Safari cannot decode a WebM recorded
 * in Chrome); then we fall back to native controls rather than leaving the
 * teacher with nothing playable.
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
  const [peaks, setPeaks] = useState<number[] | null>(null);
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
        const block = Math.max(1, Math.floor(samples.length / PEAK_COUNT));
        const values: number[] = [];
        for (let bar = 0; bar < PEAK_COUNT; bar += 1) {
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
          setPeaks(values.map((value) => Math.max(0.03, value / loudest)));
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

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) {
      return;
    }
    audio.currentTime = Math.min(audio.duration, Math.max(0, seconds));
    setCurrent(audio.currentTime);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekTo(current + 5);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekTo(current - 5);
    } else if (event.key === "Home") {
      event.preventDefault();
      seekTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seekTo(duration);
    }
  }

  if (undecodable) {
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

  return (
    <div className={cn("flex w-full min-w-0 items-center gap-2.5", className)}>
      <Button
        type="button"
        size="icon"
        className="size-9 shrink-0 rounded-full"
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        onClick={toggle}
      >
        {playing ? (
          <PauseIcon aria-hidden="true" className="size-4" />
        ) : (
          <PlayIcon aria-hidden="true" className="ml-0.5 size-4" />
        )}
      </Button>

      {peaks ? (
        // px keeps the scrub handle inside the row instead of overlapping the
        // play button or the timestamp.
        <div className="min-w-0 flex-1 px-1">
          <AudioScrubber
            data={peaks}
            currentTime={current}
            duration={duration || 1}
            onSeek={seekTo}
            onKeyDown={onKeyDown}
            aria-label={`Seek ${label}`}
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
            showHandle
            height={44}
            barWidth={2}
            barGap={1}
            barHeight={3}
            barRadius={1}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="h-11 min-w-0 flex-1 animate-pulse rounded-md bg-muted/60"
        />
      )}

      <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
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
