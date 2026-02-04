"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaRegCircleUser } from 'react-icons/fa6';
import { TEAM_LOGOS, TEAM_COLORS } from './teamLogos';
import { SignedIn, SignedOut, SignIn, SignUp, SignOutButton, useUser } from '@clerk/nextjs';

// Very lightweight user profile stored in localStorage
interface UserProfile {
  id: string;
  favoriteTeam?: string;
  teamLogoUrl?: string;
  // legacy login fields kept for backwards compatibility (ignored now)
  signedIn?: boolean;
  email?: string;
}

// Hook to persist profile in localStorage
function useUserProfile(): [UserProfile | null, (p: Partial<UserProfile>) => void] {
  // Initialize from localStorage immediately (client-only) to avoid first-paint 'None Selected'
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null; // SSR safeguard
    try {
      const raw = window.localStorage.getItem('userProfile');
      if (raw) return JSON.parse(raw) as UserProfile;
      // Legacy single-key migration (if an older version stored just the code)
      const legacyFav = window.localStorage.getItem('favoriteTeam');
      if (legacyFav) {
        const migrated: UserProfile = { id: 'local-user', favoriteTeam: legacyFav, teamLogoUrl: TEAM_LOGOS[legacyFav] };
        window.localStorage.setItem('userProfile', JSON.stringify(migrated));
        return migrated;
      }
    } catch {}
    return null;
  });

  const update = (p: Partial<UserProfile>) => {
    setProfile(prev => {
      const base = (prev || { id: 'local-user' }) as UserProfile;
      const next: UserProfile = { ...base, ...p };
      // If favoriteTeam is cleared/undefined, also drop teamLogoUrl to avoid stale logos
      if (!next.favoriteTeam) {
        delete next.favoriteTeam; // optional: remove the key entirely
        delete next.teamLogoUrl;
        try { window.localStorage.removeItem('favoriteTeam'); } catch {}
      }
      try { window.localStorage.setItem('userProfile', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return [profile, update];
}

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [profile, update] = useUserProfile();
  const { isSignedIn, isLoaded, user } = useUser();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const allTeams = [
    'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LV','LAC','LAR','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SF','SEA','TB','TEN','WAS'
  ];

  const clerkMeta = (user?.unsafeMetadata || {}) as { favoriteTeam?: string; teamLogoUrl?: string };
  const effectiveFavorite = clerkMeta.favoriteTeam || profile?.favoriteTeam;
  const effectiveLogo = clerkMeta.teamLogoUrl || profile?.teamLogoUrl;
  const derivedLogo = effectiveFavorite ? TEAM_LOGOS[effectiveFavorite] : undefined;
  const avatarSrc = (effectiveFavorite ? (effectiveLogo || derivedLogo) : undefined) || '/images/avatar-silhouette-white.svg';

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const localFav = profile?.favoriteTeam;
    const metaFav = (user.unsafeMetadata as { favoriteTeam?: string } | undefined)?.favoriteTeam;
    if (!metaFav && localFav) {
      user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata || {}),
          favoriteTeam: localFav,
          teamLogoUrl: profile?.teamLogoUrl || TEAM_LOGOS[localFav],
        },
      }).catch(() => {});
    }
  }, [isSignedIn, user, profile?.favoriteTeam, profile?.teamLogoUrl]);

  const updateFavorite = async (code?: string) => {
    if (code) {
      update({ favoriteTeam: code, teamLogoUrl: TEAM_LOGOS[code], signedIn: isSignedIn });
    } else {
      update({ favoriteTeam: undefined, teamLogoUrl: undefined });
    }

    if (!isSignedIn || !user) return;
    const nextMeta: Record<string, unknown> = { ...(user.unsafeMetadata || {}) };
    if (code) {
      nextMeta.favoriteTeam = code;
      nextMeta.teamLogoUrl = TEAM_LOGOS[code];
    } else {
      delete nextMeta.favoriteTeam;
      delete nextMeta.teamLogoUrl;
    }
    try {
      await user.update({ unsafeMetadata: nextMeta });
    } catch {}
  };

  return (
    <div className="relative" ref={menuRef}>
  {/* Dynamically inject minimal CSS for team colors (once) */}
  <style dangerouslySetInnerHTML={{ __html: Object.entries(TEAM_COLORS).map(([k,v]) => `.team-color-${k}{--team-color:${v};}`).join('') }} />
      {open ? (
        <button
          onClick={() => setOpen(o => !o)}
          aria-haspopup="true"
          aria-expanded="true"
          aria-controls="profile-menu-panel"
          className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white hover:text-white/90 focus:outline-none cursor-pointer"
        >
          {(derivedLogo || profile?.teamLogoUrl) ? (
            <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden">
              <Image src={avatarSrc} alt={profile?.favoriteTeam ? `${profile.favoriteTeam} logo` : 'Profile'} fill sizes="36px" className="object-cover" />
            </div>
          ) : (
            <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex items-center justify-center">
              <FaRegCircleUser className="w-5 h-5 md:w-6 md:h-6 text-white/80" aria-hidden="true" />
              <span className="sr-only">Profile</span>
            </div>
          )}
        </button>
      ) : (
        <button
          onClick={() => setOpen(o => !o)}
          aria-haspopup="true"
          aria-expanded="false"
          aria-controls="profile-menu-panel"
          className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white hover:text-white/90 focus:outline-none cursor-pointer"
        >
          {(derivedLogo || profile?.teamLogoUrl) ? (
            <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden">
              <Image src={avatarSrc} alt={profile?.favoriteTeam ? `${profile.favoriteTeam} logo` : 'Profile'} fill sizes="36px" className="object-cover" />
            </div>
          ) : (
            <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden flex items-center justify-center">
              <FaRegCircleUser className="w-5 h-5 md:w-6 md:h-6 text-white/80" aria-hidden="true" />
              <span className="sr-only">Profile</span>
            </div>
          )}
        </button>
      )}
      {open && (
        <div
          id="profile-menu-panel"
          className="absolute right-0 mt-3 w-[360px] max-w-[90vw] rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl p-4 shadow-2xl z-50 animate-fade-in"
          role="dialog" aria-label="Profile menu" aria-modal="false"
        >
          <div className="mb-3">
            <SignedOut>
              <div className="space-y-3">
                {isLoaded ? (
                  authMode === 'sign-in' ? (
                    <SignIn
                      routing="path"
                      path="/sign-in"
                      appearance={{ elements: { card: 'shadow-none border border-white/10 bg-[#0b0b0b] w-full' } }}
                    />
                  ) : (
                    <SignUp
                      routing="path"
                      path="/sign-up"
                      appearance={{ elements: { card: 'shadow-none border border-white/10 bg-[#0b0b0b] w-full' } }}
                    />
                  )
                ) : (
                  <div className="text-xs text-white/70">Loading sign-in…</div>
                )}
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>{authMode === 'sign-in' ? 'New here?' : 'Already have an account?'}</span>
                  <button
                    type="button"
                    className="text-white/90 hover:text-white underline-offset-4 hover:underline"
                    onClick={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}
                  >
                    {authMode === 'sign-in' ? 'Create account' : 'Sign in'}
                  </button>
                </div>
              </div>
            </SignedOut>
            {(!isLoaded || !isSignedIn) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:bg-white/10 text-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:bg-white/10 text-center"
                >
                  Sign up
                </Link>
              </div>
            )}
            <SignedIn>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="truncate">{user?.primaryEmailAddress?.emailAddress}</span>
                <SignOutButton>
                  <button className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/80">
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            </SignedIn>
          </div>

          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Favorite Team</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80 font-medium">{effectiveFavorite || 'None Selected'}</span>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/80"
                onClick={() => setShowPicker(s => !s)}
              >{showPicker ? 'Close' : (effectiveFavorite ? 'Change Team' : 'Choose Team')}</button>
            </div>
            {showPicker && (
              <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar" role="listbox" aria-label="Select Favorite Team">
                {allTeams.map(code => {
                  const active = profile?.favoriteTeam === code;
                  const color = TEAM_COLORS[code] || '#444444';
                  // Compute brightness for text contrast
                  const r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
                  const brightness = 0.2126*r + 0.7152*g + 0.0722*b;
                  const textClass = brightness > 160 ? 'text-black' : 'text-white';
                  return (
                    active ? (
                      <button
                        key={code}
                        type="button"
                        data-team={code}
                        data-active="true"
                        onClick={() => {
                          updateFavorite(code);
                          setShowPicker(false);
                          setTimeout(() => setOpen(false), 150);
                        }}
                        className={`team-color-${code} relative aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 bg-[color:var(--team-color)] ${textClass} ring-2 ring-white/70 scale-105 shadow-lg shadow-black/40`}
                        role="option"
                        aria-selected="true"
                      >{code}</button>
                    ) : (
                      <button
                        key={code}
                        type="button"
                        data-team={code}
                        data-active="false"
                        onClick={() => {
                          updateFavorite(code);
                          setShowPicker(false);
                          setTimeout(() => setOpen(false), 150);
                        }}
                        className={`team-color-${code} relative aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 bg-[color:var(--team-color)] ${textClass} opacity-90 hover:opacity-100 hover:brightness-110`}
                        role="option"
                        aria-selected="false"
                      >{code}</button>
                    )
                  );
                })}
              </div>
            )}
            {effectiveFavorite && (
              <button
                type="button"
                className="w-full text-left text-[11px] text-red-300/70 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors focus:outline-none"
                onClick={() => { updateFavorite(undefined); setShowPicker(true); }}
              >Clear Selection</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
