import api from "./api";

export type MediaKind = "IMAGE" | "AUDIO";

export const MAX_IMAGES = 5;
export const MAX_AUDIO_NOTES = 2;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 180;
export const MIN_AUDIO_SECONDS = 1;
export const MAX_IMAGE_DIMENSION = 2000;

export const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AUDIO_CONTENT_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
];

export interface MediaAttachment {
  id: string;
  kind: MediaKind;
  contentType?: string;
  byteSize?: number;
  durationSeconds?: number | null;
  url?: string;
  expiresAt?: string;
}

export interface RequestUploadInput {
  kind: MediaKind;
  contentType: string;
  byteSize: number;
  durationSeconds?: number;
}

export interface RequestUploadResult {
  id: string;
  kind: MediaKind;
  uploadUrl: string;
  expiresAt: string;
}

export interface CompletedUpload {
  id: string;
  kind: MediaKind;
  status: "PENDING" | "READY";
}

/** Strips codec parameters, matching the server's normalisation. */
export function normalizeContentType(value: string): string {
  return value.split(";")[0].trim().toLowerCase();
}

export function isAllowedImage(file: { type: string }): boolean {
  return IMAGE_CONTENT_TYPES.includes(normalizeContentType(file.type));
}

export function isAllowedAudio(type: string): boolean {
  return AUDIO_CONTENT_TYPES.includes(normalizeContentType(type));
}

export async function requestUpload(
  input: RequestUploadInput,
): Promise<RequestUploadResult> {
  const { data } = await api.post<RequestUploadResult>("/media/uploads", input);
  return data;
}

export async function completeUpload(id: string): Promise<CompletedUpload> {
  const { data } = await api.post<CompletedUpload>(
    `/media/uploads/${id}/complete`,
  );
  return data;
}

export async function abandonUpload(id: string): Promise<void> {
  await api.delete(`/media/uploads/${id}`);
}

/**
 * PUT with progress. `fetch` cannot report upload progress, and these requests
 * go straight to R2 with no auth header.
 */
export function putToStorage(
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("Upload failed. Please try again."));
    });
    request.addEventListener("error", () =>
      reject(new Error("Upload failed. Check your connection.")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("Upload cancelled.")),
    );
    request.send(body);
  });
}

/** Presign → PUT → complete, the whole round trip for one file. */
export async function uploadMedia(
  blob: Blob,
  input: {
    kind: MediaKind;
    contentType: string;
    durationSeconds?: number;
    onProgress?: (percent: number) => void;
  },
): Promise<string> {
  const presigned = await requestUpload({
    kind: input.kind,
    contentType: input.contentType,
    byteSize: blob.size,
    durationSeconds: input.durationSeconds,
  });
  await putToStorage(
    presigned.uploadUrl,
    blob,
    input.contentType,
    input.onProgress,
  );
  const completed = await completeUpload(presigned.id);
  return completed.id;
}

/**
 * Downscales photos before upload. A phone photo is often 4–8 MB; re-encoding
 * to WebP at 2000px keeps the page readable and the free tier healthy.
 */
export async function compressImage(file: File): Promise<{
  blob: Blob;
  contentType: string;
}> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "That photo format is not supported. Export it as JPG or PNG and try again.",
    );
  }

  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare that image.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp", 0.82);
  if (webp) return { blob: webp, contentType: "image/webp" };

  const jpeg = await toBlob(canvas, "image/jpeg", 0.85);
  if (jpeg) return { blob: jpeg, contentType: "image/jpeg" };
  throw new Error("Could not prepare that image.");
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Reads an audio file's duration without uploading it first. */
export function readAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        reject(new Error("Could not read that audio file."));
        return;
      }
      resolve(audio.duration);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that audio file."));
    });
    audio.src = url;
  });
}
