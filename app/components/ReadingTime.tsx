'use client';

import { Clock } from 'lucide-react';

interface ReadingTimeProps {
  minutes: number;
  className?: string;
}

export default function ReadingTime({ minutes, className = '' }: ReadingTimeProps) {
  const readingTime = minutes === 1 ? '1 min read' : `${minutes} min read`;
  
  return (
    <div className={`flex items-center gap-1 text-gray-600 text-sm ${className}`}>
      <Clock className="h-4 w-4" />
      <span>{readingTime}</span>
    </div>
  );
}
