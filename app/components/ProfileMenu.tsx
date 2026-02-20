"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaRegCircleUser } from "react-icons/fa6";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";

import { fetchCurrentUserProfile, updateCurrentUserProfile } from "@/lib/users/client";
import type { UserProfileDTO } from "@/lib/users/contracts";

import { TEAM_COLORS, TEAM_LOGOS } from "./teamLogos";

interface LocalProfile {
  favoriteTeam?: string;
  teamLogoUrl?: string;
}

const LOCAL_PROFILE_KEY = "userProfile";
const LEGACY_TEAM_KEY = "favoriteTeam";

function readLocalProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalProfile;
      if (parsed.favoriteTeam) {
        return {
          favoriteTeam: parsed.favoriteTeam,
          teamLogoUrl: TEAM_LOGOS[parsed.favoriteTeam] || parsed.teamLogoUrl,
        };
      }
    }

    const legacyFavoriteTeam = window.localStorage.getItem(LEGACY_TEAM_KEY);
    if (legacyFavoriteTeam) {
      const migrated: LocalProfile = {
        favoriteTeam: legacyFavoriteTeam,
        teamLogoUrl: TEAM_LOGOS[legacyFavoriteTeam],
      };
      window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    return null;
  }

  return null;
}

function writeLocalProfile(profile: LocalProfile | null) {
  if (typeof window === "undefined") return;

  try {
    if (!profile?.favoriteTeam) {
      window.localStorage.removeItem(LOCAL_PROFILE_KEY);
      window.localStorage.removeItem(LEGACY_TEAM_KEY);
      return;
    }

    window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    window.localStorage.removeItem(LEGACY_TEAM_KEY);
  } catch {
    // Ignore localStorage write errors.
  }
}

export default function ProfileMenu() {
  const { isSignedIn, isLoaded, user } = useUser();

  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [localProfile, setLocalProfile] = useState<LocalProfile | null>(() => readLocalProfile());
  const [serverProfile, setServerProfile] = useState<UserProfileDTO | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const legacyMigrationAttempted = useRef(false);

  const allTeams = [
    "ARI",
    "ATL",
    "BAL",
    "BUF",
    "CAR",
    "CHI",
    "CIN",
    "CLE",
    "DAL",
    "DEN",
    "DET",
    "GB",
    "HOU",
    "IND",
    "JAX",
    "KC",
    "LV",
    "LAC",
    "LAR",
    "MIA",
    "MIN",
    "NE",
    "NO",
    "NYG",
    "NYJ",
    "PHI",
    "PIT",
    "SF",
    "SEA",
    "TB",
    "TEN",
    "WAS",
  ];

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!isLoaded || !isSignedIn) {
        legacyMigrationAttempted.current = false;
        setServerProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      setErrorMessage(null);

      try {
        const profile = await fetchCurrentUserProfile();
        if (!cancelled) {
          setServerProfile(profile);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        if (!cancelled) {
          setErrorMessage("Could not load profile right now.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !serverProfile) return;
    if (legacyMigrationAttempted.current) return;

    legacyMigrationAttempted.current = true;
    const localFavorite = localProfile?.favoriteTeam;

    if (!localFavorite || serverProfile.preferences.favoriteTeam) {
      return;
    }

    void (async () => {
      try {
        const migrated = await updateCurrentUserProfile({ favoriteTeam: localFavorite });
        setServerProfile(migrated);
        setLocalProfile(null);
        writeLocalProfile(null);
      } catch (error) {
        console.error("Failed to migrate legacy local profile", error);
      }
    })();
  }, [isLoaded, isSignedIn, serverProfile, localProfile?.favoriteTeam]);

  const effectiveFavorite = isSignedIn
    ? serverProfile?.preferences.favoriteTeam ?? undefined
    : localProfile?.favoriteTeam;

  const effectiveLogo = effectiveFavorite ? TEAM_LOGOS[effectiveFavorite] : undefined;
  const avatarSrc = effectiveLogo || "/images/avatar-silhouette-white.svg";

  const updateFavorite = async (code?: string) => {
    setErrorMessage(null);

    if (!isSignedIn) {
      const next = code
        ? {
            favoriteTeam: code,
            teamLogoUrl: TEAM_LOGOS[code],
          }
        : null;

      setLocalProfile(next);
      writeLocalProfile(next);
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateCurrentUserProfile({ favoriteTeam: code ?? null });
      setServerProfile(updatedProfile);
      setLocalProfile(null);
      writeLocalProfile(null);
    } catch (error) {
      console.error("Failed to save favorite team", error);
      setErrorMessage("Could not save your favorite team. Try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <style
        dangerouslySetInnerHTML={{
          __html: Object.entries(TEAM_COLORS)
            .map(([key, value]) => `.team-color-${key}{--team-color:${value};}`)
            .join(""),
        }}
      />

      <button
        onClick={() => setOpen((state) => !state)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="profile-menu-panel"
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center text-white hover:text-white/90 focus:outline-none md:h-10 md:w-10"
      >
        {effectiveLogo ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-full md:h-9 md:w-9">
            <Image
              src={avatarSrc}
              alt={effectiveFavorite ? `${effectiveFavorite} logo` : "Profile"}
              fill
              sizes="36px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full md:h-9 md:w-9">
            <FaRegCircleUser className="h-5 w-5 text-white/80 md:h-6 md:w-6" aria-hidden="true" />
            <span className="sr-only">Profile</span>
          </div>
        )}
      </button>

      {open && (
        <div
          id="profile-menu-panel"
          className="animate-fade-in absolute right-0 z-50 mt-3 w-[360px] max-w-[90vw] rounded-2xl border border-white/10 bg-black/95 p-4 shadow-2xl backdrop-blur-xl"
          role="dialog"
          aria-label="Profile menu"
          aria-modal="false"
        >
          <div className="mb-3">
            <SignedOut>
              <div className="space-y-3">
                <div className="text-xs text-white/70">
                  Sign in to save your favorite team and personalize your experience.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white/80 hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white/80 hover:bg-white/10"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="truncate">{user?.primaryEmailAddress?.emailAddress}</span>
                <SignOutButton>
                  <button className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10">
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            </SignedIn>
          </div>

          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">Favorite Team</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">
                {effectiveFavorite || "None Selected"}
              </span>
              <button
                type="button"
                disabled={isLoadingProfile || isSavingProfile}
                className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowPicker((state) => !state)}
              >
                {showPicker
                  ? "Close"
                  : effectiveFavorite
                  ? "Change Team"
                  : "Choose Team"}
              </button>
            </div>

            {isSignedIn && isLoadingProfile && (
              <p className="text-[11px] text-white/55">Syncing your account profile...</p>
            )}

            {errorMessage && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {errorMessage}
              </p>
            )}

            {showPicker && (
              <div
                className="custom-scrollbar grid max-h-56 grid-cols-6 gap-2 overflow-y-auto pr-1"
                role="listbox"
                aria-label="Select Favorite Team"
              >
                {allTeams.map((code) => {
                  const active = effectiveFavorite === code;
                  const color = TEAM_COLORS[code] || "#444444";
                  const red = Number.parseInt(color.slice(1, 3), 16);
                  const green = Number.parseInt(color.slice(3, 5), 16);
                  const blue = Number.parseInt(color.slice(5, 7), 16);
                  const brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
                  const textClass = brightness > 160 ? "text-black" : "text-white";

                  return (
                    <button
                      key={code}
                      type="button"
                      data-team={code}
                      data-active={active}
                      onClick={() => {
                        void updateFavorite(code);
                        setShowPicker(false);
                        setTimeout(() => setOpen(false), 150);
                      }}
                      className={`team-color-${code} relative flex aspect-square items-center justify-center rounded-md bg-[color:var(--team-color)] text-[11px] font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${textClass} ${
                        active
                          ? "scale-105 ring-2 ring-white/70 shadow-lg shadow-black/40"
                          : "opacity-90 hover:brightness-110 hover:opacity-100"
                      }`}
                      role="option"
                      aria-selected={active}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            )}

            {effectiveFavorite && (
              <button
                type="button"
                disabled={isSavingProfile}
                className="w-full rounded-lg px-3 py-2 text-left text-[11px] text-red-300/70 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  void updateFavorite(undefined);
                  setShowPicker(true);
                }}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
