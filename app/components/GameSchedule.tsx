'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TEAM_META } from '@/lib/schedule';
import styles from './GameSchedule.module.css';
interface Game {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr?: string;
  awayAbbr?: string;
  homeRecord?: string;
  awayRecord?: string;
  homeTeamLogo?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
  awayTeamLogo?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  gameDate: string;
  tvNetwork?: string;
  gameImportance?: string;
  preview?: string;
  week: number;
}

interface GameScheduleProps {
  games: Game[];
  textureSrc?: string;
}


export default function GameSchedule({ games }: GameScheduleProps) {
 const rail = useRef<HTMLDivElement>(null);
 const [edges,setEdges] = useState({left:false,right:false});
 useEffect(()=>{const el=rail.current;if(!el)return;const update=()=>setEdges({left:el.scrollLeft>2,right:el.scrollLeft+el.clientWidth<el.scrollWidth-2});update();const observer=new ResizeObserver(update);observer.observe(el);el.addEventListener('scroll',update,{passive:true});return()=>{observer.disconnect();el.removeEventListener('scroll',update);};},[games]);
 if(!games.length)return null;
 const sorted=[...games].sort((a,b)=>Date.parse(a.gameDate)-Date.parse(b.gameDate));
 const scroll=(direction:number)=>rail.current?.scrollBy({left:direction*300,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 return <section className={styles.schedule} aria-label="This week's NFL games">
  <div className={styles.heading}><div><span className={styles.eyebrow}>Around the league</span><h2>NFL matchups <span>Week {sorted[0].week}</span></h2></div><div className={styles.actions}><Link href="/schedule">Full schedule <ArrowRight size={15}/></Link><button aria-label="Previous games" disabled={!edges.left} onClick={()=>scroll(-1)}><ArrowLeft size={17}/></button><button aria-label="Next games" disabled={!edges.right} onClick={()=>scroll(1)}><ArrowRight size={17}/></button></div></div>
  <div className={styles.rail} ref={rail} tabIndex={0} aria-label="Scroll NFL matchups">
   {sorted.map(game=><article key={game._id} className={styles.card}>
    <div className={styles.date}><time dateTime={game.gameDate}>{new Date(game.gameDate).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'America/New_York'})}</time><span>{new Date(game.gameDate).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})} ET</span></div>
    {(['away','home'] as const).map(side=>{const name=game[side+'Team' as 'homeTeam'|'awayTeam'];const abbr=game[side+'Abbr' as 'homeAbbr'|'awayAbbr'];const entry=Object.entries(TEAM_META).find(([code,meta])=>code===abbr||meta.name===name);const meta=entry?.[1];return <Link className={styles.team} key={side} href={meta?'/teams/'+meta.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'):'/teams'}>{meta&&<Image src={meta.logo} alt="" width={36} height={36}/>}<strong>{name.split(' ').slice(-1).join(' ')}</strong><span>{game[side+'Record' as 'homeRecord'|'awayRecord']||'—'}</span></Link>;})}
    <Link className={styles.details} href={'/schedule/week/'+game.week}>{game.tvNetwork||'View game schedule'}<ArrowRight size={14}/></Link>
   </article>)}
  </div>
 </section>;
}
