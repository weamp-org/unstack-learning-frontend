import type { Metadata } from "next";

import { PushToggle } from "@/components/push-toggle";
import { ThemeSetting } from "@/components/theme-setting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Settings — ${SITE_NAME}`,
  description: "Appearance and notification preferences for Unstack Learning.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Appearance and notification preferences for this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>
            Light, dark, or follow your system. Stored in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSetting />
        </CardContent>
      </Card>

      <PushToggle />
    </div>
  );
}
