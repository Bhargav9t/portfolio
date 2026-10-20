import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { BookOpen, Award, FileText, Trophy } from "lucide-react";
import { soundFx } from "@/utils/audio";

export function PublicationsView() {
  const { publications, awards } = PORTFOLIO_DATA;

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="parchment-banner p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#544534]/15 border border-[#544534]/40 flex items-center justify-center text-[#1a1107] shadow-sm">
            <BookOpen className="w-4 h-4 text-[#8b3c1b]" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-[#1a1107] text-xs sm:text-sm">
              PEER-REVIEWED RESEARCH & COMPETITIVE AWARDS
            </h3>
            <p className="text-[11px] text-[#59432d] font-mono">
              Published conference proceedings and recognized engineering project awards
            </p>
          </div>
        </div>
      </div>

      {/* Publications Section */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// CONFERENCE PROCEEDINGS & RESEARCH</span>
        </h3>

        {publications.map((pub) => (
          <div
            key={pub.id}
            className="parchment-card p-3.5 sm:p-4 space-y-2.5 parchment-card-hover"
          >
            {/* Top Meta: Year, Venue, Highlight */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="parchment-chip-active text-[11px] font-mono font-bold px-2 py-0.5">
                  {pub.year}
                </span>
                <span className="text-[11px] font-mono text-[#59432d] font-semibold">
                  {pub.venue}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pub.highlight && (
                  <span className="parchment-chip text-[10px]">
                    <Award className="w-3 h-3 text-[#8b3c1b]" />
                    {pub.highlight}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h4 className="text-sm sm:text-base font-mono font-bold text-[#1a1107]">
              {pub.title}
            </h4>

            {/* Authors */}
            <div className="text-[11px] font-mono text-[#59432d]">
              Authors: {pub.authors.join(", ")}
            </div>

            {/* Abstract */}
            <div className="parchment-inset p-2.5 text-xs text-[#2b1f14] leading-relaxed font-sans">
              <span className="text-[#8b3c1b] font-mono text-[11px] block mb-0.5 font-bold">OVERVIEW / ABSTRACT:</span>
              {pub.abstract}
            </div>

            {/* Document Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#69523b]">
                STATUS: Published in Proceedings (April 2026)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.hover();
                    alert(`Accessing manuscript details for: ${pub.title}`);
                  }}
                  className="parchment-chip-active px-2.5 py-1 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>VIEW RECORD</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Awards & Expo Honors Grid */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// PROJECT EXPOS & HACKATHON RECOGNITIONS</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {awards.map((award, idx) => (
            <div
              key={idx}
              className="parchment-card p-3 space-y-1.5 parchment-card-hover"
            >
              <div className="flex items-center justify-between">
                <span className="parchment-chip-active text-[11px] font-mono font-bold px-2 py-0.5">
                  {award.title}
                </span>
                <Trophy className="w-3.5 h-3.5 text-[#8b3c1b]" />
              </div>
              <h5 className="font-mono font-bold text-[#1a1107] text-xs">
                Project: {award.project}
              </h5>
              <p className="text-[11px] text-[#2b1f14] font-sans">
                {award.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
