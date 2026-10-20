import { useState } from "react";
import { type BuildingConfig, BUILDINGS } from "@/data/portfolioData";
import { Volume2, VolumeX, Terminal, Menu, X, Sparkles, Compass } from "lucide-react";
import { soundFx } from "@/utils/audio";

interface HeaderNavProps {
  activeTab: BuildingConfig["id"] | null;
  onSelectTab: (id: BuildingConfig["id"] | null) => void;
  accentColor?: number;
  onSelectColor?: (color: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isBlackHoleEasterEgg?: boolean;
  onToggleBlackHoleEasterEgg?: () => void;
}

export function HeaderNav({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
  isBlackHoleEasterEgg = false,
  onToggleBlackHoleEasterEgg,
}: HeaderNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectMobileTab = (id: BuildingConfig["id"] | null) => {
    soundFx.select();
    soundFx.splash(1.0);
    onSelectTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="w-full px-3 py-1.5 md:px-6 md:py-2 flex items-center justify-between pointer-events-auto bg-transparent z-40 transition-all select-none">
        {/* Brand & System Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundFx.close();
              onSelectTab(null);
            }}
            className="group flex items-center gap-2 text-left transition-transform hover:scale-102 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#d5b893] group-hover:border-[#d5b893] shadow-md">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-wider font-mono text-white flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                BHARGAV REDDY
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono tracking-widest backdrop-blur-md ${
                  isBlackHoleEasterEgg
                    ? "bg-red-950/80 text-red-300 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    : "bg-black/50 text-[#d5b893] border border-[#d5b893]/40 shadow-sm"
                }`}>
                  {isBlackHoleEasterEgg ? "GARGANTUA" : "SOLAR & LUNAR"}
                </span>
              </div>
              <div className="text-[9px] font-mono text-[#d5b893] flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] font-medium">
                <span className={`w-1 h-1 rounded-full animate-pulse ${
                  isBlackHoleEasterEgg ? "bg-red-500 shadow-[0_0_6px_#ef4444]" : "bg-[#ffad3d] shadow-[0_0_6px_#ffad3d]"
                }`} />
                <span>
                  {isBlackHoleEasterEgg ? "ANOMALY ACTIVE" : "CELESTIAL ARCHIVE"}
                </span>
                <span className="text-[#d5b893]/60">•</span>
                <span>5 BOTTLES</span>
              </div>
            </div>
          </button>
        </div>

        {/* Desktop Monolith Quick Tabs Navigation */}
        <nav className="hidden md:flex items-center gap-0.5 bg-black/45 backdrop-blur-md p-0.5 rounded-lg border border-white/20 shadow-md">
          {BUILDINGS.map((b) => {
            const isActive = activeTab === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  soundFx.select();
                  soundFx.splash(1.0);
                  onSelectTab(isActive ? null : b.id);
                }}
                onMouseEnter={() => soundFx.hover()}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? "bg-[#d5b893] text-[#25344f] font-bold shadow-sm scale-102"
                    : "text-[#f5ebd9] hover:text-white hover:bg-white/15 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                }`}
              >
                <span className={isActive ? "text-[#25344f] text-[9px]" : "text-[#d5b893] text-[9px]"}>
                  [{b.number}]
                </span>
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{b.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Audio Mute & Mobile Menu Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMute}
            title={isMuted ? "Enable Sound FX" : "Mute Sound FX"}
            aria-label="Toggle Sound"
            className={`p-1.5 rounded-lg backdrop-blur-md border transition-all cursor-pointer shadow-sm ${
              isMuted
                ? "bg-black/50 border-gray-700 text-gray-400 hover:text-white"
                : "bg-black/50 border-[#d5b893]/50 text-[#d5b893] hover:text-white hover:border-white shadow-[0_0_8px_rgba(213,184,147,0.3)]"
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => {
              soundFx.hover();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-1.5 rounded-lg bg-black/60 border border-[#d5b893]/50 text-[#d5b893] hover:text-white backdrop-blur-md cursor-pointer transition-all active:scale-95"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 p-4 pointer-events-auto">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#617891]/30">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#d5b893] animate-ping" />
              <span className="text-white font-bold text-sm tracking-wider">NAVIGATION DOSSIER</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section Items */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2 font-mono">
            {BUILDINGS.map((b) => {
              const isActive = activeTab === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelectMobileTab(b.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#d5b893] text-[#25344f] border-white shadow-lg"
                      : "bg-[#1c293f]/80 text-[#f5ebd9] border-[#617891]/35 hover:border-[#d5b893] active:bg-[#25344f]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      isActive ? "bg-[#25344f] text-[#d5b893]" : "bg-black/40 text-[#d5b893]"
                    }`}>
                      [{b.number}]
                    </span>
                    <div>
                      <div className="text-sm font-bold tracking-wide">{b.label}</div>
                      <div className={`text-[10px] ${isActive ? "text-[#25344f]/80" : "text-[#d5b893]/70"}`}>
                        {b.subtitle}
                      </div>
                    </div>
                  </div>
                  <Compass className={`w-4 h-4 ${isActive ? "text-[#25344f]" : "text-[#d5b893]"}`} />
                </button>
              );
            })}
          </div>

          {/* Mobile Footer Quick Toggles */}
          <div className="pt-3 border-t border-[#617891]/30 flex items-center justify-between font-mono text-[11px]">
            <button
              onClick={() => {
                onToggleMute();
              }}
              className="parchment-chip px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? "UNMUTE AUDIO" : "MUTE AUDIO"}</span>
            </button>

            {onToggleBlackHoleEasterEgg && (
              <button
                onClick={() => {
                  onToggleBlackHoleEasterEgg();
                  setIsMobileMenuOpen(false);
                }}
                className="parchment-chip parchment-chip-interactive px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8b3c1b]" />
                <span>{isBlackHoleEasterEgg ? "SOLAR CYCLE" : "GARGANTUA"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default HeaderNav;
