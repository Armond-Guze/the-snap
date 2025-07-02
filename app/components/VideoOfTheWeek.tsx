"use client";

import Image from "next/image";
import YouTubeEmbed from "./YoutubeEmbed";

const videoOfTheWeek = {
  title: "Video of the Week",
  description: "Check out this week's must-watch NFL highlight that has everyone talking",
  playerName: "Patrick Mahomes",
  team: "Kansas City Chiefs",
  playDescription: "Incredible no-look pass under pressure for the game-winning touchdown",
  videoId: "sN7e0XJMMeA", // Your new video ID here
  date: "January 15, 2025"
};

export default function VideoOfTheWeek() {
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

        {/* Embedded Video Section */}
        <div className="mb-8">
          <YouTubeEmbed 
            videoId={videoOfTheWeek.videoId}
            title={`${videoOfTheWeek.playerName} - ${videoOfTheWeek.playDescription}`}
          />
        </div>

        {/* Video Details */}
        <div className="bg-shadcn-zinc rounded-2xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">
              {videoOfTheWeek.playerName} — {videoOfTheWeek.team}
            </h3>
            <span className="text-sm text-gray-400">
              {videoOfTheWeek.date}
            </span>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            {videoOfTheWeek.playDescription}
          </p>
        </div>
      </div>
    </section>
  );
}
