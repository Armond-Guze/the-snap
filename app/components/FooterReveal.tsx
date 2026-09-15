"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Scroll reveal shared with the Armoze footer.
export default function FooterReveal({ children }: { children: ReactNode }) {
  const revealWindowRef = useRef<HTMLDivElement>(null);
  const revealContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const revealWindow = revealWindowRef.current;
    const content = revealContentRef.current;
    if (!revealWindow || !content) return;

    const desktopMotion = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
    let enabled = false;
    let footerHeight = 0;
    let motionFrame = 0;
    const updateMotion = () => {
      motionFrame = 0;
      if (!enabled) return;
      const distanceFromBottom = revealWindow.getBoundingClientRect().bottom - window.innerHeight;
      const progress = Math.max(0, Math.min(1, distanceFromBottom / footerHeight));
      // Move the entire footer, including copyright, at a gentler scroll rate.
      content.style.setProperty('--snap-footer-reveal-offset', `${(progress * footerHeight * 0.28).toFixed(2)}px`);
    };
    const queueMotion = () => {
      if (enabled && !motionFrame) motionFrame = window.requestAnimationFrame(updateMotion);
    };
    const updateReveal = () => {
      footerHeight = Math.ceil(content.getBoundingClientRect().height);
      // Keep tall footers in normal flow so every link remains reachable on short screens.
      enabled = desktopMotion.matches && footerHeight > 0 && footerHeight <= window.innerHeight - 80;
      revealWindow.style.setProperty('--snap-footer-reveal-height', `${footerHeight}px`);
      revealWindow.dataset.reveal = String(enabled);
      if (!enabled) content.style.removeProperty('--snap-footer-reveal-offset');
      queueMotion();
    };
    const observer = new ResizeObserver(updateReveal);
    observer.observe(content);
    desktopMotion.addEventListener('change', updateReveal);
    window.addEventListener('resize', updateReveal);
    window.addEventListener('scroll', queueMotion, { passive: true });
    updateReveal();

    return () => {
      observer.disconnect();
      desktopMotion.removeEventListener('change', updateReveal);
      window.removeEventListener('resize', updateReveal);
      window.removeEventListener('scroll', queueMotion);
      window.cancelAnimationFrame(motionFrame);
    };
  }, []);

  function revealFocusedFooter() {
    const revealWindow = revealWindowRef.current;
    if (revealWindow?.dataset.reveal !== 'true') return;
    const bounds = revealWindow.getBoundingClientRect();
    if (bounds.bottom > window.innerHeight || bounds.top < 0) {
      revealWindow.scrollIntoView({ block: 'end', behavior: 'instant' });
      const content = revealContentRef.current;
      content?.style.setProperty('--snap-footer-reveal-offset', '0px');
      // Keyboard navigation should reveal its target immediately, without waiting for the easing.
      content?.getAnimations().forEach((animation) => animation.finish());
    }
  }

  return (
    <div className="snap-footer-reveal-window" ref={revealWindowRef}>
      <div className="snap-footer-reveal-content" ref={revealContentRef} onFocusCapture={revealFocusedFooter}>
        {children}
      </div>
    </div>
  );
}

