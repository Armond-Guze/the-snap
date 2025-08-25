"use client";

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface ProgressiveImageProps extends Omit<ImageProps, 'placeholder'> {
  aspect?: string; // e.g. '16/9'
  rounded?: boolean;
}

export default function ProgressiveImage({ aspect, rounded = true, className = '', alt, ...props }: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={
        `relative w-full overflow-hidden ${rounded ? 'rounded-lg' : ''} bg-gray-800/40 ${
          aspect ? `aspect-[${aspect}]` : 'min-h-[200px]'
        }`
      }
    >
  <Image
  {...props}
  alt={alt || 'Article image'}
        className={`object-cover w-full h-full transition duration-700 ${loaded ? 'blur-0 opacity-100' : 'blur-md opacity-70'} ${className}`}
        onLoadingComplete={() => setLoaded(true)}
        sizes={props.sizes || '(max-width: 768px) 100vw, (max-width:1200px) 90vw, 1200px'}
        priority={props.priority}
      />
    </div>
  );
}