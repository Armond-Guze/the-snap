'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150); // Quick transition

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-gray-100/5 animate-pulse" />
        </div>
      )}
      
      {/* Page content with fade animation */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isLoading 
            ? 'opacity-0 translate-y-2' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
