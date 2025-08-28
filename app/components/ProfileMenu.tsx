"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TEAM_LOGOS } from './teamLogos';
import { FaUserCircle } from 'react-icons/fa';

// Very lightweight future-proof user model
interface UserProfile {
  id: string;
  favoriteTeam?: string; // team code e.g. 'BAL'
  teamLogoUrl?: string; // optional logo URL to replace placeholder
  signedIn?: boolean;
  email?: string;
}

// Simple localStorage bridge (can swap to Sanity or auth provider later)
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
  const [profile, update] = useUserProfile();
  const [email, setEmail] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [authMsg, setAuthMsg] = useState('');

  // Placeholder avatar / team logo
  const derivedLogo = profile?.favoriteTeam ? TEAM_LOGOS[profile.favoriteTeam] : undefined;
  const avatarSrc = profile?.teamLogoUrl || derivedLogo || '/images/avatar-placeholder.png';

  const allTeams = [
    'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LV','LAC','LAR','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SF','SEA','TB','TEN','WAS'
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
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
          className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl p-4 shadow-2xl z-50"
          role="dialog" aria-label="Profile menu"
        >
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Account</p>
          {!profile?.signedIn && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/40 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if(authStatus!=='idle') { setAuthStatus('idle'); setAuthMsg(''); } }}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={authStatus==='loading'}
                className="w-full text-center text-sm font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2 transition-colors focus:outline-none disabled:opacity-50"
                onClick={async () => {
                  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthStatus('error'); setAuthMsg('Enter a valid email'); return; }
                  try {
                    setAuthStatus('loading');
                    const res = await fetch('/api/newsletter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
                    const data = await res.json().catch(()=>({}));
                    if(!res.ok) { throw new Error(data.error || 'Failed'); }
                    update({ signedIn: true, email });
                    setAuthStatus('success');
                    setAuthMsg(data.message || 'Subscribed');
                  } catch(e) {
                    setAuthStatus('error');
                    setAuthMsg(e instanceof Error ? e.message : 'Error');
                  }
                }}
              >{authStatus==='loading' ? 'Saving...' : 'Sign Up / Sign In'}</button>
              {authStatus==='error' && <p className="text-xs text-red-400">{authMsg}</p>}
              {authStatus==='success' && <p className="text-xs text-green-400">{authMsg}</p>}
              <p className="text-[11px] text-white/40">We use email only for account personalization & newsletter.</p>
            </div>
          )}
          {profile?.signedIn && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/40 mb-2">Favorite Team</label>
                <select
                  aria-label="Favorite Team"
                  value={profile.favoriteTeam || ''}
                  onChange={e => { const code = e.target.value; update({ favoriteTeam: code, teamLogoUrl: TEAM_LOGOS[code] }); setOpen(false); }}
                  className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none appearance-none custom-select-dark"
                >
                  <option value="" disabled>Select team</option>
                  {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {!profile.favoriteTeam && <p className="mt-2 text-[11px] text-white/50">Pick a team to personalize later.</p>}
              </div>
              <div className="flex items-center justify-between gap-2">
                {profile.email && <span className="text-[10px] text-white/40 truncate" title={profile.email}>{profile.email}</span>}
                <button
                  type="button"
                  className="ml-auto text-left text-xs text-red-300/70 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors focus:outline-none"
                  onClick={() => { update({ signedIn: false, favoriteTeam: undefined, email: undefined }); setEmail(''); setAuthStatus('idle'); setAuthMsg(''); }}
                >Sign Out</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
