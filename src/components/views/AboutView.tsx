import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { User, Code2, Server, Cpu, ExternalLink, Mail, Sparkles, GraduationCap, Award, Compass } from "lucide-react";
import { soundFx } from "@/utils/audio";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";

export function AboutView({ onOpenContact }: { onOpenContact: () => void }) {
  const { profile, education } = PORTFOLIO_DATA;

  return (
    <div className="space-y-3">
      {/* Hero Bio Banner */}
      <div className="parchment-banner p-3 sm:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5">
              <span className="parchment-chip text-[9px] px-1.5 py-0.2">
                <Sparkles className="w-2.5 h-2.5 text-[#8b3c1b]" />
                <span>AI & MACHINE LEARNING • FULL-STACK</span>
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold font-mono tracking-tight text-[#1a1107]">
              {profile.name}
            </h2>
            <div className="text-[11px] font-mono text-[#59432d] font-semibold">
              {profile.location} • {profile.phone} • {profile.email}
            </div>
            <p className="text-xs text-[#2b1f14] max-w-xl leading-relaxed font-sans pt-0.5">
              {profile.tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                soundFx.select();
                onOpenContact();
              }}
              className="parchment-chip-active px-2.5 py-1 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Mail className="w-3 h-3" />
              <span>SIGNAL</span>
            </button>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="parchment-chip parchment-chip-interactive px-2.5 py-1 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <GithubIcon className="w-3 h-3" />
              <span>GITHUB</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#59432d]" />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="parchment-chip parchment-chip-interactive px-2.5 py-1 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <LinkedinIcon className="w-3 h-3" />
              <span>LINKEDIN</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#59432d]" />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {profile.stats.map((stat, i) => (
          <div
            key={i}
            className="parchment-card p-2 text-center parchment-card-hover"
          >
            <div className="text-base md:text-lg font-mono font-bold text-[#1a1107]">
              {stat.value}
            </div>
            <div className="text-[9px] font-mono text-[#69523b] font-semibold uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Narrative Section */}
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// PROFESSIONAL SUMMARY & PHILOSOPHY</span>
        </h3>
        <div className="space-y-2 text-xs leading-relaxed font-sans">
          {profile.bio.map((paragraph, idx) => (
            <div key={idx} className="parchment-card p-2.5 text-[#2b1f14]">
              {paragraph}
            </div>
          ))}
        </div>
      </div>

      {/* Core Technical Capabilities Matrix */}
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// TECHNICAL CAPABILITIES MATRIX</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Languages */}
          <div className="parchment-card p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1a1107] font-bold">
              <Code2 className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>PROGRAMMING LANGUAGES</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.skills.languages.map((skill) => (
                <span
                  key={skill}
                  className="parchment-chip px-1.5 py-0.2 text-[10px] font-mono text-[#2b1d10]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Frameworks & Libraries */}
          <div className="parchment-card p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1a1107] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>FRAMEWORKS & LIBRARIES</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.skills.frameworks.map((skill) => (
                <span
                  key={skill}
                  className="parchment-chip px-1.5 py-0.2 text-[10px] font-mono text-[#2b1d10]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Backend & Cloud Databases */}
          <div className="parchment-card p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1a1107] font-bold">
              <Server className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>BACKEND, CLOUD & DATABASES</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.skills.backendCloud.map((skill) => (
                <span
                  key={skill}
                  className="parchment-chip px-1.5 py-0.2 text-[10px] font-mono text-[#2b1d10]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* AI, Tools & Environments */}
          <div className="parchment-card p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1a1107] font-bold">
              <Cpu className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>AI, TOOLS & ENVIRONMENTS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.skills.aiTools.map((skill) => (
                <span
                  key={skill}
                  className="parchment-chip px-1.5 py-0.2 text-[10px] font-mono text-[#2b1d10]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Education & Academic History */}
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// EDUCATION HISTORY</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {education.map((edu, idx) => (
            <div key={idx} className="parchment-card p-2.5 space-y-1 parchment-card-hover">
              <span className="parchment-chip-active text-[9px] font-mono px-1.5 py-0.2">
                {edu.period}
              </span>
              <h4 className="font-mono font-bold text-[#1a1107] text-xs">
                {edu.institution}
              </h4>
              <div className="text-[10px] font-mono text-[#59432d] font-semibold">
                {edu.degree}
              </div>
              <p className="text-[10px] text-[#2b1f14] font-sans">
                {edu.highlights}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications & Hackathons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Certifications */}
        <div className="parchment-card p-3 space-y-2 parchment-card-hover">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1a1107] font-bold">
            <Award className="w-3.5 h-3.5 text-[#8b3c1b]" />
            <span>CERTIFICATIONS</span>
          </div>
          <ul className="space-y-1">
            {profile.certifications.map((cert, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[10px] font-mono text-[#2b1f14]">
                <span className="w-1 h-1 rounded-full bg-[#8b3c1b]" />
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hackathon Competitions */}
        <div className="parchment-card p-3 space-y-2 parchment-card-hover">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#1a1107] font-bold">
            <Compass className="w-3.5 h-3.5 text-[#8b3c1b]" />
            <span>NATIONAL & GLOBAL COMPETITIONS</span>
          </div>
          <ul className="space-y-1">
            {profile.hackathons.map((hack, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[10px] font-mono text-[#2b1f14]">
                <span className="w-1 h-1 rounded-full bg-[#8b3c1b]" />
                <span>{hack}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
