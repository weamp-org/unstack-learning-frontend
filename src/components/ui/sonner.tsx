"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          /* Tinted, not solid: the surface stays popover with a faint wash of
             the status colour and a matching border. Text stays neutral so
             both themes keep their contrast; the icon carries the colour. */
          "--success-bg": "color-mix(in oklab, var(--success) 8%, var(--popover))",
          "--success-border":
            "color-mix(in oklab, var(--success) 30%, var(--border))",
          "--success-text": "var(--popover-foreground)",
          "--warning-bg": "color-mix(in oklab, var(--warning) 8%, var(--popover))",
          "--warning-border":
            "color-mix(in oklab, var(--warning) 30%, var(--border))",
          "--warning-text": "var(--popover-foreground)",
          "--error-bg":
            "color-mix(in oklab, var(--destructive) 8%, var(--popover))",
          "--error-border":
            "color-mix(in oklab, var(--destructive) 30%, var(--border))",
          "--error-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success: "[&_[data-icon]]:text-success",
          warning: "[&_[data-icon]]:text-warning",
          error: "[&_[data-icon]]:text-destructive",
        },
      }}
      richColors
      {...props}
    />
  )
}

export { Toaster }
