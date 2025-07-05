"use client";

import Image from "next/image";

const videoOfTheWeek = {
  title: "Video of the Week",
  playerName: "Patrick Mahomes",
  team: "Kansas City Chiefs",
  playDescription: "Incredible no-look pass under pressure for the game-winning touchdown",
  videoId: "KwZREjezPFw",
  date: "January 15, 2025"
};

export default function VideoOfTheWeek() {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoOfTheWeek.videoId}/maxresdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoOfTheWeek.videoId}`;

  return (
    <section className="relative py-16 sm:py-24 text-white overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/backgroundImage1.png"
          alt="NFL background"
          fill
          priority
          quality={100}
          className="object-cover opacity-5"
          sizes="100vw"
        />
      </div>

      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/80 -z-10" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-gray-400 text-base font-semibold mb-4 tracking-wider uppercase">
            Featured Content
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {videoOfTheWeek.title}
          </p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {videoOfTheWeek.description}
          </p>
          <div className="w-24 h-1 bg-white mx-auto rounded-full mt-6"></div>
        </div>

        {/* Video Thumbnail Section */}
        <div className="mb-8">
          <div className="rounded-2xl overflow-hidden group hover:shadow-white/10 transition-all duration-500">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative"
              title={`Watch ${videoOfTheWeek.playerName} highlights on YouTube`}
            >
              <div className="aspect-[16/9] w-full overflow-hidden relative">
                <Image
                  src={thumbnailUrl}
                  alt={`${videoOfTheWeek.playerName} highlight`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* YouTube play overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {/* Video of the Week badge */}
                <div className="absolute top-6 left-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-full shadow-lg">
                  <span className="font-bold text-sm">VIDEO OF THE WEEK</span>
                </div>
              </div>
            </a>
            
            {/* Video Info */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {videoOfTheWeek.playerName} — {videoOfTheWeek.team}
                </h3>
                <span className="text-sm text-gray-400">
                  {videoOfTheWeek.date}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                {videoOfTheWeek.playDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
