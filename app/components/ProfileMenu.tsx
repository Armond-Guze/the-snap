"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { TEAM_LOGOS, TEAM_COLORS } from './teamLogos';
import { FaUserCircle } from 'react-icons/fa';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userProfile');
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  const update = (p: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...(prev || { id: 'local-user' }), ...p } as UserProfile;
      try { localStorage.setItem('userProfile', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return [profile, update];
}

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [profile, update] = useUserProfile();
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

  const derivedLogo = profile?.favoriteTeam ? TEAM_LOGOS[profile.favoriteTeam] : undefined;
  const avatarSrc = profile?.teamLogoUrl || derivedLogo || '/images/avatar-placeholder.png';

  return (
    <div className="relative" ref={menuRef}>
  {/* Dynamically inject minimal CSS for team colors (once) */}
  <style dangerouslySetInnerHTML={{ __html: Object.entries(TEAM_COLORS).map(([k,v]) => `.team-color-${k}{--team-color:${v};}`).join('') }} />
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
  aria-expanded={open ? "true" : "false"}
        aria-controls="profile-menu-panel"
        className="relative w-10 h-10 flex items-center justify-center text-white hover:text-white/90 focus:outline-none"
      >
        {(derivedLogo || profile?.teamLogoUrl) ? (
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10">
            <Image src={avatarSrc} alt={profile?.favoriteTeam ? `${profile.favoriteTeam} logo` : 'Profile'} fill sizes="36px" className="object-cover" />
          </div>
        ) : (
          <FaUserCircle className="w-8 h-8" />
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl p-4 shadow-2xl z-50 animate-fade-in"
          role="dialog" aria-label="Profile menu" aria-modal="false"
        >
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Favorite Team</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80 font-medium">{profile?.favoriteTeam || 'None Selected'}</span>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/80"
                onClick={() => setShowPicker(s => !s)}
              >{showPicker ? 'Close' : (profile?.favoriteTeam ? 'Change Team' : 'Choose Team')}</button>
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
                    <button
                      key={code}
                      type="button"
                      data-team={code}
                      data-active={active ? 'true' : 'false'}
                      onClick={() => {
                        update({ favoriteTeam: code, teamLogoUrl: TEAM_LOGOS[code], signedIn: true });
                        setShowPicker(false);
                        setTimeout(() => setOpen(false), 150);
                      }}
                      className={`team-color-${code} relative aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 bg-[color:var(--team-color)] ${textClass} ${active ? 'ring-2 ring-white/70 scale-105 shadow-lg shadow-black/40' : 'opacity-90 hover:opacity-100 hover:brightness-110'} `}
                      role="option"
                      aria-selected={active ? 'true' : 'false'}
                    >{code}</button>
                  );
                })}
              </div>
            )}
            {profile?.favoriteTeam && (
              <button
                type="button"
                className="w-full text-left text-[11px] text-red-300/70 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors focus:outline-none"
                onClick={() => { update({ favoriteTeam: undefined }); setShowPicker(true); }}
              >Clear Selection</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
