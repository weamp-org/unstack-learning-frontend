"use client";

import { MicIcon } from "lucide-react";
import Image from "next/image";
import { Waveform } from "@/components/media/waveform";

import type { MediaAttachment } from "@/lib/media";

export function MediaGallery({ media }: { media?: MediaAttachment[] }) {
  const items = (media ?? []).filter((item) => item.url);
  if (items.length === 0) return null;

  const images = items.filter((item) => item.kind === "IMAGE");
  const audio = items.filter((item) => item.kind === "AUDIO");

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border"
            >
              {/* Signed, short-lived R2 URL: no optimisation pipeline applies. */}
              <Image
                src={item.url as string}
                alt="Attachment shared with the request"
                width={400}
                height={400}
                unoptimized
                className="aspect-square w-full object-cover"
              />
            </a>
          ))}
        </div>
      ) : null}

      {audio.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-1 rounded-lg border p-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <MicIcon aria-hidden="true" className="size-4" />
            Voice note {index + 1}
            {item.durationSeconds
              ? ` · ${formatDuration(item.durationSeconds)}`
              : ""}
          </span>
          <Waveform
            src={item.url as string}
            label={`voice note ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
