"use client";

import Image from "next/image";

const qbs = [
  {
    name: "Patrick Mahomes — Kansas City Chiefs",
    description:
      "There's no denying Mahomes is still the standard at quarterback. Fresh off his 3rd straight Super Bowl appearance, he remains at the top of the game. His arm strength, improvisation, and poise under pressure are unmatched. With another Super Bowl run in sight, he remains the player every defense fears.",
    videoId: "SAhgKF2qEZs",
  },
  {
    name: "Joe Burrow — Cincinnati Bengals",
    description:
      "When healthy, Burrow is as clutch and precise as they come. His connection with Ja'Marr Chase and leadership presence continue to drive the Bengals' offense. The tandem should be in the mix for MVP, and offensive player of the year. Expect a strong comeback season if he stays injury-free.",
    videoId: "Qa_0_ATCmkA",
  },
  {
    name: "Jalen Hurts — Philadelphia Eagles",
    description:
      "Super Bowl MVP. Enough said. Hurts silenced the doubters after a convincing win in the Super Bowl. His rushing ability, combined with a strong arm, gives Philly unmatched versatility. This offense is stacked to the brim with players like Saquon Barkley and A.J. Brown, so expect nothing but a stellar season.",
    videoId: "rqcp3YzSPDU",
  },
  {
    name: "Josh Allen — Buffalo Bills",
    description:
      "After not getting past the hump again this past season, Allen should have a major chip on his shoulder. With new offensive acquisitions, this team should hum along to another AFC Championship game against...",
    videoId: "8TVyeKi0XRg",
  },
  {
    name: "Lamar Jackson — Baltimore Ravens",
    description:
      "After being snubbed last year for MVP, Lamar Jackson is still in the prime of his career and playing as good as anyone in the regular season. With another year older on his legs, doubts may start fluttering whether or not his speed will be the same, but he will continue to dominate.",
    videoId: "5uBL7M3_5xk",
  },
];

export default function CardsBento() {
  return (
    <section className="relative min-h-screen py-24 sm:py-32 text-white overflow-hidden z-0 bg-transparent">
      {/* Background Image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/backgroundImage1.png"
          alt="Quarterbacks background"
          fill
          priority
          quality={100}
          className="object-cover opacity-30"
          sizes="100vw"
        />
      </div>

      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/80 -z-10" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-indigo-400 text-base font-semibold mb-4 tracking-wider uppercase">
            Elite QB Watch
          </h2>
          <p className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Top 5 Quarterbacks to Watch in 2025
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {qbs.map((qb, i) => (
            <div
              key={i}
              className="bg-black/70 backdrop-blur-md text-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col transition-all duration-500 hover:scale-[1.02] border border-white/10 group"
            >
              <a
                href={`https://www.youtube.com/watch?v=${qb.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative"
                title={`Watch ${qb.name} highlights on YouTube`}
              >
                <div className="aspect-[16/9] w-full overflow-hidden relative">
                  <Image
                    src={`https://img.youtube.com/vi/${qb.videoId}/hqdefault.jpg`}
                    alt={qb.name}
                    width={480}
                    height={360}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* YouTube play overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Rank badge */}
                  <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                    <span className="text-white font-bold text-lg">#{i + 1}</span>
                  </div>
                </div>
              </a>
              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">
                  {qb.name}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{qb.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
