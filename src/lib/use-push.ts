import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  sendTestPush,
} from "@/lib/push.functions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function keyToB64(sub: PushSubscription, name: "p256dh" | "auth") {
  const key = sub.getKey(name);
  if (!key) return "";
  const bytes = new Uint8Array(key);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return window.btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function usePushNotifications() {
  const supported =
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(Boolean(sub) && Notification.permission === "granted"))
      .catch(() => setEnabled(false));
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported) {
      toast.error("This browser does not support push notifications.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was blocked. Allow it in browser settings.");
        return;
      }
      const { key } = await getVapidPublicKey();
      if (!key) {
        toast.error("Push keys are not configured on the server.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
        }));

      await savePushSubscription({
        data: {
          endpoint: sub.endpoint,
          p256dh: keyToB64(sub, "p256dh"),
          auth: keyToB64(sub, "auth"),
          label: navigator.userAgent.slice(0, 110),
        },
      });
      setEnabled(true);
      toast.success("Order alerts enabled on this device");
    } catch (err) {
      toast.error("Could not enable notifications on this device.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription({ data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setEnabled(false);
      toast.success("Order alerts turned off on this device");
    } catch {
      toast.error("Could not turn off notifications.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const test = useCallback(async () => {
    setBusy(true);
    try {
      await sendTestPush();
      toast.success("Test alert sent to your devices");
    } catch {
      toast.error("Could not send test alert.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, enabled, busy, enable, disable, test };
}
