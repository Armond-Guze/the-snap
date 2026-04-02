'use client';

import Image from 'next/image';

type ArticleHeroCoverProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
};

export default function ArticleHeroCover({
  src,
  alt,
  sizes,
  priority = false,
}: ArticleHeroCoverProps) {
  return (
    <div className="relative -mx-6 overflow-hidden bg-zinc-950 sm:-mx-5">
      <div className="relative h-[220px] sm:h-[310px] md:h-[430px]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-contain object-center"
          priority={priority}
        />
      </div>
    </div>
  );
}
