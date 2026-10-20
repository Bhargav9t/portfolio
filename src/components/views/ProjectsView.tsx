import { useState } from "react";
import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { ExternalLink, Sparkles, Activity, Award } from "lucide-react";
import { soundFx } from "@/utils/audio";
import { GithubIcon } from "@/components/Icons";

export function ProjectsView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "AI & EdTech Architecture",
    "Sustainability & Gamification",
    "Security & Distributed PWA",
    "Engineering Education Platform",
    "Production Web Development",
  ];

  const filteredProjects = selectedCategory === "All"
    ? PORTFOLIO_DATA.projects
    : PORTFOLIO_DATA.projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-3">
      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-1 pb-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              soundFx.hover();
              setSelectedCategory(cat);
            }}
            className={`px-2 py-0.5 text-[10px] font-mono transition-all duration-150 cursor-pointer ${
              selectedCategory === cat
                ? "parchment-chip-active scale-102"
                : "parchment-chip parchment-chip-interactive"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="parchment-card p-2.5 sm:p-3 space-y-2 parchment-card-hover flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              {/* Header: Category & Award badge */}
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[9px] font-mono text-[#69523b] font-bold uppercase tracking-wider">
                  {project.category}
                </span>
                {project.featured && (
                  <span className="parchment-chip text-[8px] px-1 py-0.2">
                    <Sparkles className="w-2 h-2 text-[#8b3c1b]" />
                    KEY SYSTEM
                  </span>
                )}
              </div>

              {/* Award Callout */}
              {project.award && (
                <div className="parchment-inset p-1.5 flex items-center gap-1 text-[10px] font-mono text-[#1a1107] font-semibold">
                  <Award className="w-3 h-3 text-[#8b3c1b]" />
                  <span>{project.award}</span>
                </div>
              )}

              {/* Title & Description */}
              <h3 className="text-sm sm:text-base font-bold font-mono text-[#1a1107]">
                {project.title}
              </h3>
              <p className="text-xs text-[#2b1f14] leading-normal font-sans">
                {project.description}
              </p>
              <div className="parchment-inset p-2 text-[11px] text-[#3c2a18] leading-relaxed font-sans">
                {project.fullDetails}
              </div>

              {/* Performance Stats if present */}
              {project.stats && (
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {project.stats.map((s, idx) => (
                    <div key={idx} className="parchment-inset px-2 py-1">
                      <div className="text-[11px] font-mono font-bold text-[#1a1107] flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5 text-[#8b3c1b]" />
                        {s.value}
                      </div>
                      <div className="text-[9px] text-[#69523b] font-mono font-semibold">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="parchment-chip px-1.5 py-0.2 text-[9px] font-mono text-[#2b1d10]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap items-center gap-2 pt-2 mt-1.5 border-t border-[#8c7b64]/30">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="parchment-chip-active px-2 py-0.5 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>LIVE REPO / DEMO</span>
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="parchment-chip parchment-chip-interactive px-2 py-0.5 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <GithubIcon className="w-3 h-3" />
                  <span>SOURCE CODE</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
