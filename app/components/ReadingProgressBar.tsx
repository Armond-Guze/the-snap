'use client';

import { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  className?: string;
}

export default function ReadingProgressBar({ className = '' }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    // Update on scroll
    window.addEventListener('scroll', updateProgress);
    
    // Update on resize (content height might change)
    window.addEventListener('resize', updateProgress);
    
    // Initial calculation
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div className={`fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 ${className}`}>
      <div 
        className={`h-full bg-white transition-all duration-150 ease-out shadow-sm border-r border-gray-300`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
