import { ArchiveIcon, ClockIcon, UserCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type RequestStatus = "OPEN" | "ACCEPTED" | "CLOSED";

interface StatusConfig {
  label: string;
  short: string;
  Icon: typeof ClockIcon;
  className: string;
}

const STATUS_CONFIG: Record<RequestStatus, StatusConfig> = {
  OPEN: {
    label: "Awaiting review",
    short: "Awaiting",
    Icon: ClockIcon,
    className: "border-warning/25 bg-warning/10 text-warning",
  },
  ACCEPTED: {
    label: "Accepted",
    short: "Accepted",
    Icon: UserCheckIcon,
    className: "border-primary/25 bg-primary/10 text-primary",
  },
  CLOSED: {
    label: "Closed",
    short: "Closed",
    Icon: ArchiveIcon,
    className: "border-border bg-muted text-muted-foreground",
  },
};

export function requestStatusLabel(status: RequestStatus): string {
  return STATUS_CONFIG[status].label;
}

export function requestStatusShortLabel(status: RequestStatus): string {
  return STATUS_CONFIG[status].short;
}

/**
 * Status is carried by an icon and a word as well as colour, so it reads for
 * colour-blind users and in both themes.
 */
export function RequestStatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.Icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {config.label}
    </span>
  );
}
