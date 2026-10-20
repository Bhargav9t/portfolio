import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { Briefcase, Calendar, MapPin, CheckCircle2, GraduationCap } from "lucide-react";

export function ExperienceView() {
  const { experience, education } = PORTFOLIO_DATA;

  return (
    <div className="space-y-4">
      {/* Experience Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// PROFESSIONAL EXPERIENCE & LEADERSHIP</span>
        </h3>

        <div className="relative border-l-2 border-[#d5b893]/40 ml-2.5 sm:ml-3 space-y-4 pl-4 sm:pl-6">
          {experience.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Node Dot */}
              <div className="absolute -left-[23px] sm:-left-[31px] top-2 w-3.5 h-3.5 rounded-full bg-[#d5b893] border-2 border-[#544534] shadow-[0_0_8px_rgba(213,184,147,0.8)]" />

              <div className="parchment-card p-3.5 sm:p-4 space-y-2.5 parchment-card-hover">
                {/* Header: Role & Period */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold font-mono text-[#1a1107]">
                      {item.role}
                    </h4>
                    <div className="text-xs font-mono text-[#59432d] font-semibold">
                      {item.company}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <span className="parchment-chip text-[11px] px-2 py-0.5">
                      <Calendar className="w-3 h-3 text-[#8b3c1b]" />
                      <span>{item.period}</span>
                    </span>
                    <span className="parchment-chip text-[11px] px-2 py-0.5">
                      <MapPin className="w-3 h-3 text-[#8b3c1b]" />
                      <span>{item.location}</span>
                    </span>
                  </div>
                </div>

                {/* Highlights List */}
                <ul className="space-y-1.5 pt-0.5">
                  {item.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#2b1f14] leading-relaxed font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8b3c1b] shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1 pt-2 border-t border-[#8c7b64]/30">
                  {item.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="parchment-chip px-1.5 py-0.5 text-[10px] font-mono text-[#2b1d10]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education Timeline */}
      <div className="space-y-3 pt-3 border-t border-[#d5b893]/30">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-[#f5ebd9] flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-[#d5b893]" />
          <span>// ACADEMIC EDUCATION & MILESTONES</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {education.map((edu, idx) => (
            <div key={idx} className="parchment-card p-3 space-y-1.5 parchment-card-hover">
              <span className="parchment-chip-active text-[11px] font-mono font-bold px-2 py-0.5">
                {edu.period}
              </span>
              <h5 className="font-mono font-bold text-[#1a1107] text-xs">
                {edu.institution}
              </h5>
              <div className="text-[11px] font-mono text-[#59432d] font-semibold">
                {edu.degree}
              </div>
              <p className="text-[11px] text-[#2b1f14] font-sans">
                {edu.highlights}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
