import { useEffect } from "react";
import { type BuildingConfig, BUILDINGS } from "@/data/portfolioData";
import { X, ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { soundFx } from "@/utils/audio";
import { AboutView } from "@/components/views/AboutView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { PublicationsView } from "@/components/views/PublicationsView";
import { ExperienceView } from "@/components/views/ExperienceView";
import { ContactView } from "@/components/views/ContactView";

interface DossierModalProps {
  activeTab: BuildingConfig["id"] | null;
  onClose: () => void;
  onSelectTab: (id: BuildingConfig["id"]) => void;
}

export function DossierModal({ activeTab, onClose, onSelectTab }: DossierModalProps) {
  // ESC key listener to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundFx.close();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!activeTab) return null;

  const currentBuilding = BUILDINGS.find((b) => b.id === activeTab) || BUILDINGS[0];
  const currentIndex = BUILDINGS.findIndex((b) => b.id === activeTab);

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + BUILDINGS.length) % BUILDINGS.length;
    soundFx.select();
    onSelectTab(BUILDINGS[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % BUILDINGS.length;
    soundFx.select();
    onSelectTab(BUILDINGS[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 pointer-events-auto animate-in fade-in duration-200">
      {/* Darkened backdrop with blur */}
      <div
        className="absolute inset-0 bg-[#25344f]/80 backdrop-blur-md cursor-pointer transition-opacity"
        onClick={() => {
          soundFx.close();
          onClose();
        }}
      />

      {/* Main Glassmorphic HUD Dossier Window: Responsive sizing */}
      <div className="relative w-full max-w-2xl max-h-[88vh] sm:max-h-[80vh] md:max-h-[74vh] flex flex-col rounded-xl border border-[#617891]/40 bg-[#1c293f]/95 shadow-[0_0_40px_rgba(37,52,79,0.85)] backdrop-blur-2xl overflow-hidden z-10 transition-all">
        {/* Top Window Chrome Bar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 sm:px-3 border-b border-[#617891]/35 bg-[#25344f]/90 select-none">
          {/* Left: Bottle Status and Callout */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d5b893] shadow-[0_0_8px_#d5b893] animate-pulse" />
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#d5b893] font-bold text-xs tracking-wide">
                [{currentBuilding.number}]
              </span>
              <span className="text-[#f5ebd9] font-bold text-xs tracking-wider">
                {currentBuilding.label}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-[#d5b893]/75">
                — {currentBuilding.subtitle}
              </span>
            </div>
          </div>

          {/* Right: Quick Tab Steppers & Close Button */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-[#25344f]/90 rounded-md border border-[#617891]/35 p-0.5">
              <button
                onClick={handlePrev}
                title="Previous Bottle"
                aria-label="Previous Section"
                className="p-1 sm:p-0.5 hover:bg-[#617891]/20 rounded text-[#d5b893] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              </button>
              <span className="text-[9px] font-mono px-1 text-[#d5b893]">
                {currentIndex + 1}/{BUILDINGS.length}
              </span>
              <button
                onClick={handleNext}
                title="Next Bottle"
                aria-label="Next Section"
                className="p-1 sm:p-0.5 hover:bg-[#617891]/20 rounded text-[#d5b893] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              </button>
            </div>

            <button
              onClick={() => {
                soundFx.close();
                onClose();
              }}
              title="Close (Esc)"
              aria-label="Close Modal"
              className="p-1.5 sm:p-1 rounded-md bg-[#d5b893]/15 hover:bg-[#d5b893]/30 border border-[#d5b893]/50 text-[#f5ebd9] transition-all cursor-pointer flex items-center justify-center min-w-[28px] min-h-[28px]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Body: Responsive padding & touch-pan-y */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 space-y-2.5 custom-scrollbar text-[#f5ebd9] overscroll-contain touch-pan-y">
          {activeTab === "about" && (
            <AboutView onOpenContact={() => onSelectTab("contact")} />
          )}
          {activeTab === "projects" && <ProjectsView />}
          {activeTab === "publications" && <PublicationsView />}
          {activeTab === "experience" && <ExperienceView />}
          {activeTab === "contact" && <ContactView />}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-3 py-1 border-t border-[#617891]/25 bg-[#25344f]/90 flex flex-wrap items-center justify-between text-[9px] font-mono text-[#d5b893]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-[#d5b893]" />
              <span className="tracking-wide text-[#f5ebd9]/90">MESSAGE ARCHIVE // CELESTIAL SEA</span>
            </span>
            <span className="hidden md:inline text-[#617891]">|</span>
            <span className="hidden md:inline text-[#d5b893]/70">
              ESC TO RETURN
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 sm:mt-0">
            <button
              onClick={handlePrev}
              className="text-[#d5b893] hover:text-white hover:underline transition-colors cursor-pointer"
            >
              PREV
            </button>
            <span className="text-[#617891]">•</span>
            <button
              onClick={handleNext}
              className="text-[#d5b893] hover:text-white hover:underline transition-colors cursor-pointer"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
