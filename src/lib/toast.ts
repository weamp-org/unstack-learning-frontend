import { toast } from "sonner";

/**
 * Error toast keyed by its own message.
 *
 * Sonner gives every toast an id, so duplicates are never a missing-id problem
 * — they come from calling `toast.error` twice for the same failure (a retry,
 * a double click, a background refetch). Passing the message as the id makes
 * the second call replace the first instead of stacking, while two genuinely
 * different failures still show separately.
 */
export function errorToast(message: string): void {
  toast.error(message, { id: message });
}
