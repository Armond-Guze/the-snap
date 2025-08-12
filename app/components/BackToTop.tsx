'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  className?: string;
  showAfter?: number; // Show button after scrolling X pixels
}

export default function BackToTop({ 
  className = '', 
  showAfter = 300 
}: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', toggleVisibility);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        bg-white hover:bg-gray-100 
        text-black 
        rounded-full 
        p-3 
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-in-out
        hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2
        border border-gray-200
        ${className}
      `}
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
