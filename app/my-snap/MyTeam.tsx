"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import TeamAlerts from "./TeamAlerts";
import { TEAM_META } from "@/lib/schedule";
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
} from "@/lib/users/client";
export default function MyTeam() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const code = isSignedIn
          ? (await fetchCurrentUserProfile())?.preferences.favoriteTeam
          : JSON.parse(localStorage.getItem("userProfile") || "{}")
              .favoriteTeam || localStorage.getItem("favoriteTeam");
        if (!cancelled) setTeam(code && TEAM_META[code] ? code : "");
      } catch {
        if (!cancelled)
          setError("Your team could not be loaded. Try refreshing this page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const refresh = () => void load();
    window.addEventListener("snap-profile-updated", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("snap-profile-updated", refresh);
    };
  }, [isLoaded, isSignedIn, user?.id]);
  async function choose(code: string) {
    setSaving(true);
    setError("");
    try {
      if (isSignedIn)
        await updateCurrentUserProfile({ favoriteTeam: code || null });
      else {
        localStorage.setItem(
          "userProfile",
          JSON.stringify(
            code
              ? { favoriteTeam: code, teamLogoUrl: TEAM_META[code].logo }
              : {},
          ),
        );
        localStorage.removeItem("favoriteTeam");
      }
      setTeam(code);
      window.dispatchEvent(new Event("snap-profile-updated"));
    } catch {
      setError("Could not save your team. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  const meta = TEAM_META[team];
  return (
    <section
      className="mt-8 rounded-2xl border border-neutral-200 bg-slate-50 p-6"
      aria-labelledby="my-team-heading"
    >
      <h2 id="my-team-heading" className="text-xl font-bold">
        Your team
      </h2>
      <label className="mt-4 block text-sm font-medium" htmlFor="my-team">
        Favorite NFL team
      </label>
      <select
        id="my-team"
        disabled={loading || saving || !isLoaded}
        value={team}
        onChange={(e) => void choose(e.target.value)}
        className="mt-2 w-full rounded-lg border border-neutral-300 bg-white p-3"
      >
        <option value="">
          {loading ? "Loading your team…" : "Choose a team"}
        </option>
        {Object.entries(TEAM_META).map(([code, t]) => (
          <option value={code} key={code}>
            {t.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-neutral-500">
        {isSignedIn
          ? "Saved to your account."
          : "Saved on this device. Sign in to use an account favorite."}
      </p>
      <p role="status" className="mt-2 text-sm text-red-700">
        {error || (saving ? "Saving…" : "")}
      </p>
      {meta && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Image src={meta.logo} alt="" width={48} height={48} />
          <Link
            className="font-semibold text-[#032c57] hover:underline"
            href={
              "/teams/" + meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            }
          >
            {meta.name} news →
          </Link>
          <Link
            className="text-sm font-semibold text-[#032c57] hover:underline"
            href={"/schedule?team=" + team}
          >
            Team schedule →
          </Link>
        </div>
      )}
      <TeamAlerts team={team} />
    </section>
  );
}
