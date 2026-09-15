"use client";
import { useRef, useState } from "react";
import { Newspaper, Trophy, Mail, ShieldCheck } from "lucide-react";
const footerBenefits = [
{ title: "Around the NFL", description: "The stories that matter across the league.", Icon: Newspaper },
{ title: "Power rankings", description: "Where every team stands, all season long.", Icon: Trophy },
{ title: "The Snap in your inbox", description: "Rankings and analysis. Free to subscribe.", Icon: Mail },
{ title: "Our editorial standards", description: "Named sources. Clear analysis. Open corrections.", Icon: ShieldCheck },
];
export default function FooterBenefits() {
  const [activeBenefit, setActiveBenefit] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function showBenefit(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return (
    <section className="snap-footer-benefits" aria-label="Follow The Game Snap">
      <div className="snap-footer-benefits-surface">
        <div className="snap-footer-benefits-inner" id="snap-footer-benefits-track" ref={trackRef} onScroll={(event) => {
          const track = event.currentTarget;
          if (!track.clientWidth) return;
          setActiveBenefit(Math.max(0, Math.min(footerBenefits.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
        }}>
          {footerBenefits.map(({ title, description, Icon }, index) => (
            <div className="snap-footer-benefit" key={title} id={`snap-footer-benefit-${index}`}>
              <Icon aria-hidden="true" size={24} strokeWidth={1.6} />
              <div><h2>{title}</h2><p>{description}</p></div>
            </div>
          ))}
        </div>
        <div className="snap-footer-benefit-dots" role="group" aria-label="Explore our coverage">
          {footerBenefits.map(({ title }, index) => (
            <button key={title} type="button" aria-label={`Show ${title.toLowerCase()}`} aria-controls={`snap-footer-benefit-${index}`} aria-current={activeBenefit === index ? 'true' : undefined} onClick={() => showBenefit(index)} onKeyDown={(event) => {
              const nextIndex = event.key === 'ArrowRight' ? Math.min(index + 1, footerBenefits.length - 1)
                : event.key === 'ArrowLeft' ? Math.max(index - 1, 0)
                  : event.key === 'Home' ? 0 : event.key === 'End' ? footerBenefits.length - 1 : null;
              if (nextIndex === null) return;
              event.preventDefault();
              showBenefit(nextIndex);
              event.currentTarget.parentElement?.querySelectorAll('button')[nextIndex]?.focus({ preventScroll: true });
            }}><span /></button>
          ))}
        </div>
      </div>
    </section>
  );
}

