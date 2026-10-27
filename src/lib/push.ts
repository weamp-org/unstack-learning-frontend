import { isAxiosError } from "axios";

import api, { apiErrorMessage } from "./api";

export interface PushSubscriptionRow {
  id: string;
  userId: string;
  endpoint: string;
  createdAt: string;
}

export interface PushSendResult {
  sent: number;
  pruned: number;
  failed: number;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function vapidPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set; push setup needs a VAPID public key.",
    );
  }
  return key;
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}

/** The browser's current subscription for our worker, if any. */
export async function getBrowserSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.getRegistration());
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Subscribe this device: register the worker, ask the push service for an
 * endpoint, and store it on the backend against the signed-in user. */
export async function subscribeDevice(): Promise<PushSubscriptionRow> {
  const registration = await serviceWorkerRegistration();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey()),
  });
  const { data } = await api.post<PushSubscriptionRow>(
    "/push/subscriptions",
    subscription.toJSON(),
  );
  return data;
}

/** Unsubscribe this device: drop the browser endpoint, then the backend row. */
export async function unsubscribeDevice(): Promise<void> {
  const subscription = await getBrowserSubscription();
  const endpoint = subscription?.endpoint;
  // Browser first: even if the backend call fails, this device stops
  // receiving pushes.
  await subscription?.unsubscribe();
  if (endpoint) {
    await api.delete("/push/subscriptions", { data: { endpoint } });
  }
}

export async function sendTestPush(): Promise<PushSendResult> {
  const { data } = await api.post<PushSendResult>("/push/test");
  return data;
}

export function pushErrorMessage(error: unknown, fallback: string): string {
  // Browser-side failures (unsupported, permission denied) carry the only
  // useful explanation; axios errors do not — their message is "Request
  // failed with status code 503", so they go through the shared mapper.
  if (!isAxiosError(error) && error instanceof Error && error.message) {
    return error.message;
  }
  return apiErrorMessage(error, fallback, {
    503: "Push delivery isn't configured on the server yet.",
  });
}
