"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBrowserSubscription,
  isPushSupported,
  pushErrorMessage,
  sendTestPush,
  subscribeDevice,
  unsubscribeDevice,
} from "@/lib/push";
import { errorToast } from "@/lib/toast";

type PushState = "unsupported" | "denied" | "off" | "on" | "working";

export function PushToggle() {
  const [state, setState] = useState<PushState>("working");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!isPushSupported()) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const subscription = await getBrowserSubscription();
        if (!cancelled) setState(subscription ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        if (permission === "denied") {
          errorToast(
            "Notifications are blocked. Allow them in your browser settings to turn push on.",
          );
        }
        return;
      }
      await subscribeDevice();
      setState("on");
      toast.success("Push notifications on for this device.");
    } catch (error) {
      setState("off");
      errorToast(pushErrorMessage(error, "Could not turn push on."));
    }
  }

  async function disable() {
    setState("working");
    try {
      await unsubscribeDevice();
      setState("off");
      toast.success("Push notifications off for this device.");
    } catch (error) {
      // The browser endpoint is already dropped inside unsubscribeDevice;
      // re-check rather than assuming either state.
      try {
        const subscription = await getBrowserSubscription();
        setState(subscription ? "on" : "off");
      } catch {
        setState("off");
      }
      errorToast(pushErrorMessage(error, "Could not turn push off."));
    }
  }

  async function test() {
    setTesting(true);
    try {
      const result = await sendTestPush();
      if (result.sent > 0) {
        toast.success(
          `Test push sent to ${result.sent} device${result.sent === 1 ? "" : "s"}. Check your notifications.`,
        );
      } else if (result.pruned > 0) {
        toast.warning(
          "Your saved endpoint expired and was removed. Turn push off and on again.",
        );
        setState("off");
      } else {
        toast.warning("No devices to send to. Turn push on first.");
      }
    } catch (error) {
      errorToast(pushErrorMessage(error, "Could not send a test push."));
    } finally {
      setTesting(false);
    }
  }

  if (state === "unsupported") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Push notifications</CardTitle>
          <CardDescription>
            This browser doesn&apos;t support push notifications. Your inbox
            above still gets everything.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Push notifications</CardTitle>
        <CardDescription>
          {state === "denied"
            ? "Notifications are blocked in this browser. Allow them in your browser settings, then come back to turn push on."
            : state === "on"
              ? "This device gets a push for new requests, acceptances and session updates."
              : "Get a push on this device even when Unstack Learning isn't open."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {state === "on" ? (
          <>
            <Button variant="outline" size="sm" onClick={() => void disable()}>
              Turn off on this device
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={testing}
              onClick={() => void test()}
            >
              {testing ? "Sending…" : "Send test push"}
            </Button>
          </>
        ) : state === "denied" ? null : (
          <Button
            variant="outline"
            size="sm"
            disabled={state === "working"}
            onClick={() => void enable()}
          >
            {state === "working" ? "Checking…" : "Turn on for this device"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
