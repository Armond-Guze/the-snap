"use client";
import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Capacitor } from "@capacitor/core";
import { readingWorker } from "@/lib/offline-reading";
import { TEAM_META } from "@/lib/schedule";
type Device = { id: string; team: string; createdAt: string };
type Setup = {
  owner: string;
  configured: boolean;
  publicKey: string | null;
  devices: Device[];
};
async function api(method: string, body?: unknown) {
  const res = await fetch("/api/me/push", {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Team alerts could not be loaded.");
  return data;
}
export default function TeamAlerts({ team }: { team: string }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const owner = isSignedIn ? user.id : "";
  const [setup, setSetup] = useState<Setup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSupported(
        !Capacitor.isNativePlatform() &&
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          "Notification" in window,
      );
      setError("");
      if (!owner) return;
      try {
        const data = await api("GET");
        if (!cancelled) setSetup({ ...data, owner });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [owner]);
  const current = setup?.owner === owner ? setup : null;
  async function enable() {
    setBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(
          "Notifications are blocked. You can allow them in your browser settings.",
        );
      const registration = await readingWorker();
      const key = current?.publicKey;
      if (!key) throw new Error("Team alerts are not ready yet.");
      const bytes = Uint8Array.from(
        atob(key.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }));
      try {
        await api("PUT", { ...subscription.toJSON(), team });
      } catch (e) {
        if (!existing) await subscription.unsubscribe();
        throw e;
      }
      setSetup({ ...(await api("GET")), owner });
      setError("Team alerts enabled for this browser.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-6 border-t border-neutral-200 pt-5">
      <h3 className="font-semibold">Team alerts</h3>
      <p className="mt-2 text-sm text-neutral-600">
        Get the latest story for your selected team. Alerts are optional and set
        separately on each device.
      </p>
      {!isLoaded ? (
        <p className="mt-3 text-sm">Loading…</p>
      ) : !isSignedIn ? (
        <SignInButton mode="modal">
          <button className="mt-3 font-semibold text-[#032c57] underline">
            Sign in to manage alerts
          </button>
        </SignInButton>
      ) : (
        <>
          <p className="mt-3 text-sm text-neutral-600">
            {!supported
              ? "Use a supported browser to set up web alerts. On iPhone, add The Snap to your Home Screen first. Native app alerts are not available yet."
              : !current
                ? "Checking alert availability…"
                : !current.configured
                  ? "Team alerts are not available yet. You can still save stories and download them to read offline."
                  : !team
                    ? "Choose your team above to enable alerts."
                    : "Enable alerts here to follow " +
                      TEAM_META[team]?.name +
                      "."}
          </p>
          <button
            className="mt-3 rounded-full bg-[#032c57] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            disabled={busy || !supported || !current?.configured || !team}
            onClick={() => void enable()}
          >
            {busy ? "Updating…" : "Enable / update this device"}
          </button>
          {Boolean(current?.devices.length) && (
            <ul className="mt-4 space-y-3">
              {current?.devices.map((device) => (
                <li
                  className="flex items-center justify-between gap-3 text-sm"
                  key={device.id}
                >
                  <span>
                    {TEAM_META[device.team]?.name || device.team} · added{" "}
                    {new Date(device.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    disabled={busy}
                    className="font-medium underline"
                    aria-label={
                      "Stop alerts for " +
                      (TEAM_META[device.team]?.name || device.team) +
                      " device " +
                      device.id
                    }
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await api("DELETE", { id: device.id });
                        setSetup({ ...(await api("GET")), owner });
                        setError(
                          "Alerts stopped for this device registration.",
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Stop alerts
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p role="status" className="mt-2 text-sm text-neutral-600">
        {error}
      </p>
    </div>
  );
}
